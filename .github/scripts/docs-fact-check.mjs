import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { posix, resolve } from 'node:path';

const marker = '<!-- classroomio-docs-fact-check -->';
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const event = JSON.parse(readFileSync(process.env.REVIEW_EVENT_PATH, 'utf8'));
const [owner, repo] = repository.split('/');
const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

if (!token || !process.env.OPENCODE_API_KEY) {
  throw new Error('GITHUB_TOKEN and OPENCODE_API_KEY are required');
}

async function githubRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }

  return response.status === 204 ? null : response.json();
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
}

function gitFetch(ref) {
  const credentials = Buffer.from(`x-access-token:${token}`).toString('base64');
  execFileSync('git', ['fetch', '--no-tags', 'origin', ref], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${credentials}`
    }
  });
}

function parseChangedLines(diff, paths) {
  const changedLines = new Map(paths.map((path) => [path, new Set()]));
  let currentPath;
  let line = 0;

  for (const textLine of diff.split('\n')) {
    if (textLine === '+++ /dev/null') {
      currentPath = undefined;
    } else if (textLine.startsWith('+++ b/')) {
      currentPath = textLine.slice(6);
    } else if (textLine.startsWith('@@ ')) {
      const match = textLine.match(/\+(\d+)(?:,\d+)?/);
      if (match) line = Number(match[1]);
    } else if (changedLines.has(currentPath) && textLine.startsWith('+') && !textLine.startsWith('+++')) {
      changedLines.get(currentPath).add(line);
      line += 1;
    } else if (changedLines.has(currentPath) && textLine.startsWith(' ')) {
      line += 1;
    }
  }

  return changedLines;
}

function parseReview(textOutput) {
  const cleanOutput = textOutput.replace(/\u001b\[[0-9;]*m/g, '').trim();
  const match = cleanOutput.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error(`OpenCode returned no JSON: ${cleanOutput.slice(0, 1000)}`);
  }

  const review = JSON.parse(match[0]);

  if (
    !Number.isInteger(review.score) ||
    review.score < 1 ||
    review.score > 5 ||
    typeof review.summary !== 'string' ||
    !Array.isArray(review.findings) ||
    !Array.isArray(review.unverified_images)
  ) {
    throw new Error('OpenCode returned an invalid score or findings list');
  }

  return review;
}

function isDocumentationPath(path) {
  return (
    typeof path === 'string' &&
    (path.startsWith('apps/help/content/help/') ||
      path.startsWith('apps/docs/content/docs/') ||
      path === 'README.md' ||
      ((path.startsWith('apps/') || path.startsWith('packages/')) && path.endsWith('/README.md'))) &&
    !path.includes('..')
  );
}

function imagePathForReference(docPath, reference) {
  if (/^https?:\/\//.test(reference) || reference.startsWith('data:')) return null;

  if (reference.startsWith('/help/')) {
    const imagePath = posix.normalize(`apps/help/public/${reference.slice('/help/'.length)}`);
    return imagePath.startsWith('apps/help/public/') ? imagePath : null;
  }

  if (reference.startsWith('/docs/')) {
    const imagePath = posix.normalize(`apps/docs/public/${reference.slice('/docs/'.length)}`);
    return imagePath.startsWith('apps/docs/public/') ? imagePath : null;
  }

  if (reference.startsWith('/')) return null;

  const imagePath = posix.normalize(posix.join(posix.dirname(docPath), reference));
  if (imagePath.startsWith('../') || imagePath.startsWith('/')) return null;

  return imagePath;
}

function buildImageInventory(worktree) {
  const docPaths = git('-C', worktree, 'ls-files', '-z')
    .split('\0')
    .filter((path) => isDocumentationPath(path) && /\.(md|mdx)$/.test(path));
  const images = [];

  for (const docPath of docPaths) {
    const content = readFileSync(resolve(worktree, docPath), 'utf8');
    const references = content.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g);

    for (const reference of references) {
      const imagePath = imagePathForReference(docPath, reference[2]);
      if (!imagePath || !/\.(png|jpe?g|gif|webp)$/i.test(imagePath)) continue;

      const imageExists = existsSync(resolve(worktree, imagePath));
      images.push({ doc_path: docPath, image_path: imagePath, alt: reference[1], exists: imageExists });
    }
  }

  return images;
}

function formatScore(review) {
  const allGood = review.findings.length === 0 && review.unverified_images.length === 0;
  const score = allGood ? 5 : Math.min(review.score, 4);
  const status = score === 5 ? '✅' : '📝';
  const unverified =
    review.unverified_images.length > 0
      ? `\n\nImages needing manual review: ${review.unverified_images.map((path) => `\`${path}\``).join(', ')}`
      : '';
  const summary =
    score === 5
      ? 'All good'
      : `${review.findings.length === 0 ? 'Image review incomplete' : review.summary}${unverified}`;

  return { score, body: `${marker}\n${status} **Documentation fact check: ${score}/5**\n\n${summary}` };
}

function runOpenCode(worktree, prompt) {
  const { GITHUB_TOKEN, GH_TOKEN, ...safeEnvironment } = process.env;
  const configuration = {
    $schema: 'https://opencode.ai/config.json',
    agents: {
      'docs-review': {
        description: 'Fact checks PR changes against hand-written documentation',
        mode: 'primary',
        steps: 30,
        permissions: [
          { action: '*', resource: '*', effect: 'deny' },
          { action: 'read', resource: '*', effect: 'allow' },
          { action: 'glob', resource: '*', effect: 'allow' },
          { action: 'grep', resource: '*', effect: 'allow' }
        ]
      }
    }
  };
  const result = spawnSync(
    'opencode',
    ['run', '--standalone', '--agent', 'docs-review', '--model', 'opencode-go/deepseek-v4.1-flash', prompt],
    {
      cwd: worktree,
      encoding: 'utf8',
      maxBuffer: 12 * 1024 * 1024,
      timeout: 20 * 60 * 1000,
      env: {
        ...safeEnvironment,
        OPENCODE_CONFIG_CONTENT: JSON.stringify(configuration),
        OPENCODE_DISABLE_PROJECT_CONFIG: '1',
        OPENCODE_DISABLE_EXTERNAL_SKILLS: '1',
        OPENCODE_PURE: '1'
      }
    }
  );

  if (result.error || result.status !== 0) {
    throw new Error(`OpenCode failed: ${result.error?.message || result.stderr || result.stdout}`);
  }

  return parseReview(result.stdout);
}

async function getReplyContext(pullRequest) {
  if (process.env.REVIEW_EVENT_NAME !== 'pull_request_review_comment') return null;

  const comment = await githubRequest(`/pulls/comments/${event.comment.id}`);
  if (comment.pull_request_url !== `${apiBase}/pulls/${pullRequest.number}`) return false;
  if (!comment.in_reply_to_id || comment.user.type === 'Bot') return false;

  const root = await githubRequest(`/pulls/comments/${comment.in_reply_to_id}`);
  if (root.user.login !== 'github-actions[bot]' || !root.body.includes(marker)) return false;

  const thread = [root];
  let page = 1;

  while (true) {
    const comments = await githubRequest(`/pulls/${pullRequest.number}/comments?per_page=100&page=${page}`);
    thread.push(...comments.filter((entry) => entry.in_reply_to_id === root.id));
    if (comments.length < 100) break;

    page += 1;
  }

  return { root, thread, comment };
}

async function main() {
  const pullRequestNumber = event.pull_request?.number ?? event.number;
  const pullRequest = await githubRequest(`/pulls/${pullRequestNumber}`);
  const replyContext = await getReplyContext(pullRequest);

  if (replyContext === false) return;

  gitFetch(pullRequest.base.sha);
  gitFetch(`refs/pull/${pullRequest.number}/head`);
  const headSha = git('rev-parse', 'FETCH_HEAD').trim();

  if (headSha !== pullRequest.head.sha) {
    throw new Error('PR head changed while preparing the review');
  }

  const diff = git('diff', '--no-ext-diff', '--unified=0', `${pullRequest.base.sha}...${headSha}`);
  const paths = git('diff', '--no-ext-diff', '--name-only', '-z', `${pullRequest.base.sha}...${headSha}`)
    .split('\0')
    .filter(Boolean);
  const changedLines = parseChangedLines(diff, paths);
  const worktree = mkdtempSync(resolve(tmpdir(), 'classroomio-docs-review-'));
  let worktreeAdded = false;

  try {
    git('worktree', 'add', '--detach', worktree, headSha);
    worktreeAdded = true;
    writeFileSync(resolve(worktree, '.docs-review-diff.patch'), diff);
    const imageInventory = buildImageInventory(worktree);
    writeFileSync(resolve(worktree, '.docs-review-images.json'), JSON.stringify(imageInventory));

    const instructions = readFileSync('.github/prompts/docs-fact-check.md', 'utf8');
    const conversation = replyContext
      ? `\nRe-review requested in this existing review thread. Address the latest reply in a short \"reply\" field in your JSON. Thread: ${JSON.stringify(replyContext.thread.map((entry) => ({ author: entry.user.login, body: entry.body })))}\n`
      : '';
    const review = runOpenCode(worktree, `${instructions}${conversation}`);
    const findings = review.findings.filter(
      (finding) =>
        isDocumentationPath(finding.doc_path) &&
        existsSync(resolve(worktree, finding.doc_path)) &&
        changedLines.has(finding.change_path) &&
        typeof finding.explanation === 'string' &&
        finding.explanation.trim() &&
        (finding.kind === 'text' ||
          (finding.kind === 'image' &&
            imageInventory.some(
              (image) => image.doc_path === finding.doc_path && image.image_path === finding.image_path && image.exists
            )))
    );

    if (findings.length !== review.findings.length) {
      throw new Error('OpenCode returned a finding with an invalid documentation path, changed file, or explanation');
    }

    if (findings.length > 30) {
      throw new Error('OpenCode returned more than 30 documentation findings');
    }

    if (
      review.unverified_images.length > 30 ||
      review.unverified_images.some((path) => !imageInventory.some((image) => image.image_path === path))
    ) {
      throw new Error('OpenCode returned too many unverified images or a path outside the documentation inventory');
    }

    const result = formatScore({ ...review, findings });

    if (replyContext) {
      const answer =
        typeof review.reply === 'string' && review.reply.trim()
          ? review.reply.trim()
          : result.body.replace(marker, '').trim();
      const body = `${marker}\n${result.score === 5 ? '✅' : '📝'} **Re-review: ${result.score}/5**\n\n${answer}`;
      await githubRequest(`/pulls/${pullRequest.number}/comments/${replyContext.root.id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ body })
      });

      return;
    }

    await githubRequest(`/pulls/${pullRequest.number}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ commit_id: headSha, event: 'COMMENT', body: result.body })
    });

    const firstChangedPath = changedLines.keys().next().value;
    if (firstChangedPath) {
      await githubRequest(`/pulls/${pullRequest.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ commit_id: headSha, path: firstChangedPath, subject_type: 'file', body: result.body })
      });
    }

    for (const finding of findings) {
      const line = Number(finding.change_line);
      const hasLine = Number.isInteger(line) && changedLines.get(finding.change_path).has(line);
      const target =
        finding.kind === 'image'
          ? `**Documentation image out of date:** \`${finding.image_path}\` in \`${finding.doc_path}\``
          : `**Documentation out of date:** \`${finding.doc_path}\``;
      const body = `${marker}\n${target}\n\n${finding.explanation}`;
      const location = hasLine ? { line, side: 'RIGHT' } : { subject_type: 'file' };
      await githubRequest(`/pulls/${pullRequest.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ commit_id: headSha, path: finding.change_path, ...location, body })
      });
    }
  } finally {
    rmSync(resolve(worktree, '.docs-review-diff.patch'), { force: true });
    rmSync(resolve(worktree, '.docs-review-images.json'), { force: true });
    if (worktreeAdded) {
      git('worktree', 'remove', '--force', worktree);
    } else {
      rmSync(worktree, { recursive: true, force: true });
    }
  }
}

await main();
