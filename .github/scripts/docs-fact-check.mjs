import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { posix, resolve, sep } from 'node:path';

const marker = '<!-- classroomio-docs-fact-check -->';
const checkedShaPattern = /<!-- classroomio-docs-fact-check-sha:([0-9a-f]{40}) -->/;
const botLogin = 'github-actions[bot]';
const resolveOnly = process.argv.includes('--resolve-only');
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
let event;
const [owner, repo] = repository.split('/');
const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

if (!token) {
  throw new Error('GITHUB_TOKEN is required');
}

if (!resolveOnly) {
  if (!process.env.OPENCODE_API_KEY) {
    throw new Error('OPENCODE_API_KEY is required');
  }

  event = JSON.parse(readFileSync(process.env.REVIEW_EVENT_PATH, 'utf8'));
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

/**
 * Sends a GraphQL request with the job token. Throws on errors.
 */
async function githubGraphQL(query, variables = {}) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const payload = await response.json();

  if (!response.ok || payload.errors) {
    throw new Error(`GitHub GraphQL failed: ${JSON.stringify(payload.errors ?? payload)}`);
  }

  return payload.data;
}

function docPathFromThreadBody(body) {
  const imageMatch = body.match(/\*\*Documentation image out of date:\*\* `[^`]+` in `([^`]+)`/);
  if (imageMatch) return imageMatch[1];

  return body.match(/\*\*Documentation out of date:\*\* `([^`]+)`/)?.[1];
}

async function getFactCheckThreads(pullNumber) {
  const data = await githubGraphQL(
    `query($owner:String!, $repo:String!, $number:Int!) {
      repository(owner:$owner, name:$repo) {
        pullRequest(number:$number) {
          reviewThreads(first:100) {
            nodes { id isResolved comments(first:1) { nodes { body } } }
          }
        }
      }
    }`,
    { owner, repo, number: pullNumber }
  );

  return data.repository.pullRequest.reviewThreads.nodes
    .map((thread) => ({ id: thread.id, isResolved: thread.isResolved, body: thread.comments.nodes[0]?.body ?? '' }))
    .filter((thread) => thread.body.includes(marker));
}

/**
 * Finding comments that could not be posted as review threads (their file left
 * the PR diff) are stored as regular PR comments instead.
 */
async function getFactCheckIssueComments(pullNumber) {
  const comments = [];

  for (let page = 1; ; page += 1) {
    const batch = await githubRequest(`/issues/${pullNumber}/comments?per_page=100&page=${page}`);
    comments.push(...batch);
    if (batch.length < 100) break;
  }

  return comments
    .filter((comment) => comment.user?.login === botLogin && comment.body?.includes(marker))
    .map((comment) => ({ id: comment.id, body: comment.body, docPath: docPathFromThreadBody(comment.body) }))
    .filter((comment) => comment.docPath);
}

/**
 * Builds the list of threads to resolve and fallback comments to remove.
 *
 * `resolveAll` clears everything, which is what a full clean check does.
 * `fullReview` means every finding was rechecked, not just the listed ones.
 * `activeDocPaths` keeps pages that are still reported open. On an incremental
 * run, only the specific threads and comments passed to the reviewer resolve;
 * anything omitted (for example by the 30-entry cap) stays open.
 */
function buildResolutionPlan(
  threads,
  fallbackComments,
  {
    resolveAll = false,
    fullReview = false,
    activeDocPaths = new Set(),
    revalidatedThreadIds = new Set(),
    revalidatedCommentIds = new Set()
  } = {}
) {
  const resolveThreadIds = [];
  const deleteCommentIds = [];
  const canResolve = (docPath, wasRevalidated) => {
    if (!docPath) return true;
    if (activeDocPaths.has(docPath)) return false;
    if (resolveAll || fullReview) return true;

    return wasRevalidated;
  };

  for (const thread of threads) {
    if (thread.isResolved) continue;
    if (canResolve(docPathFromThreadBody(thread.body), revalidatedThreadIds.has(thread.id))) {
      resolveThreadIds.push(thread.id);
    }
  }

  for (const comment of fallbackComments) {
    if (canResolve(comment.docPath, revalidatedCommentIds.has(comment.id))) {
      deleteCommentIds.push(comment.id);
    }
  }

  return { resolveThreadIds, deleteCommentIds };
}

function writeResolutionPlan(plan) {
  const planPath = process.env.RESOLUTION_PLAN_PATH;

  if (planPath) {
    writeFileSync(planPath, JSON.stringify(plan));
  }
}

/**
 * Applies a plan produced by the review job. This runs in its own job so the
 * token that can resolve threads never shares a job with PR content.
 */
async function applyResolutionPlan({ resolveThreadIds = [], deleteCommentIds = [] }) {
  for (const threadId of resolveThreadIds) {
    // Best-effort: a permission or API failure must not fail the resolution job.
    try {
      await githubGraphQL(`mutation($id:ID!) { resolveReviewThread(input:{threadId:$id}) { thread { id } } }`, {
        id: threadId
      });
    } catch (error) {
      console.warn(`Could not resolve fact-check thread ${threadId}:`, error.message);
    }
  }

  for (const commentId of deleteCommentIds) {
    try {
      await githubRequest(`/issues/comments/${commentId}`, { method: 'DELETE' });
    } catch (error) {
      console.warn(`Could not remove fact-check comment ${commentId}:`, error.message);
    }
  }
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

function commitExists(sha) {
  return spawnSync('git', ['cat-file', '-e', `${sha}^{commit}`]).status === 0;
}

function isAncestor(ancestor, descendant) {
  return spawnSync('git', ['merge-base', '--is-ancestor', ancestor, descendant]).status === 0;
}

/**
 * Records the checked commit in the posted body so the next run can review only
 * the commits added after this one.
 */
function withCheckedSha(body, sha) {
  return `${body}\n<!-- classroomio-docs-fact-check-sha:${sha} -->`;
}

/**
 * Finds the commit checked by the most recent fact-check review or reply.
 * Only bodies authored by the fact-check bot count, so a PR participant cannot
 * forge a checkpoint that makes the next run skip the review.
 */
async function getLastCheckedSha(pullNumber) {
  const entries = [];

  for (let page = 1; ; page += 1) {
    const reviews = await githubRequest(`/pulls/${pullNumber}/reviews?per_page=100&page=${page}`);
    entries.push(
      ...reviews.map((review) => ({
        author: review.user?.login ?? '',
        body: review.body ?? '',
        createdAt: review.submitted_at ?? ''
      }))
    );
    if (reviews.length < 100) break;
  }

  for (let page = 1; ; page += 1) {
    const comments = await githubRequest(`/pulls/${pullNumber}/comments?per_page=100&page=${page}`);
    entries.push(
      ...comments.map((comment) => ({
        author: comment.user?.login ?? '',
        body: comment.body ?? '',
        createdAt: comment.created_at ?? ''
      }))
    );
    if (comments.length < 100) break;
  }

  let latest = null;

  for (const entry of entries) {
    if (entry.author !== botLogin) continue;

    const match = entry.body.match(checkedShaPattern);

    if (!match) continue;
    if (!latest || entry.createdAt >= latest.createdAt) latest = { sha: match[1], createdAt: entry.createdAt };
  }

  return latest?.sha ?? null;
}

function assertContainedSymlinks(worktree) {
  const root = realpathSync(worktree);
  const trackedPaths = git('-C', worktree, 'ls-files', '-z').split('\0').filter(Boolean);

  for (const trackedPath of trackedPaths) {
    const file = resolve(worktree, trackedPath);
    if (!lstatSync(file).isSymbolicLink()) continue;

    const target = realpathSync(file);
    if (target === root || target.startsWith(`${root}${sep}`)) continue;

    throw new Error(`PR symlink escapes the review worktree: ${trackedPath}`);
  }
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

function diffScope(baseSha, headSha) {
  const diff = git('diff', '--no-ext-diff', '--unified=0', `${baseSha}...${headSha}`);
  const paths = git('diff', '--no-ext-diff', '--name-only', '-z', `${baseSha}...${headSha}`)
    .split('\0')
    .filter(Boolean);

  return { diff, paths, changedLines: parseChangedLines(diff, paths) };
}

class ReviewParseError extends Error {
  constructor(message, rawOutput) {
    super(message);
    this.rawOutput = rawOutput ?? '';
  }
}

function parseReview(textOutput) {
  const cleanOutput = textOutput.replace(/\u001b\[[0-9;]*m/g, '').trim();
  const match = cleanOutput.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new ReviewParseError(`OpenCode returned no JSON: ${cleanOutput.slice(0, 1000)}`, cleanOutput);
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
    throw new ReviewParseError('OpenCode returned an invalid score or findings list', cleanOutput);
  }

  return review;
}

/**
 * Derives the reviewer agent's step budget from the number of changed files,
 * so large PRs are not rationed mid-review by the default 30-step limit.
 */
function stepBudgetFor(changedFileCount) {
  return Math.min(150, 30 + Math.ceil(changedFileCount / 10) * 10);
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

function runOpenCodeProcess(args, { cwd, env, timeoutMs, maxBufferBytes }) {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn('opencode', args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const output = { stdout: '', stderr: '' };
    let settled = false;
    let timedOut = false;

    function settle(onDone) {
      if (settled) return false;

      settled = true;
      clearTimeout(timer);
      onDone();
      return true;
    }

    function fail(error) {
      return settle(() => rejectProcess(error));
    }

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.on('error', fail);

    for (const streamName of ['stdout', 'stderr']) {
      const stream = child[streamName];
      stream.setEncoding('utf8');
      stream.on('data', (chunk) => {
        if (settled) return;

        output[streamName] += chunk;

        if (Buffer.byteLength(output[streamName]) > maxBufferBytes) {
          child.kill('SIGTERM');
          fail(new Error(`OpenCode ${streamName} exceeded ${maxBufferBytes} bytes`));
        }
      });
    }

    child.on('close', (code, signal) => {
      if (timedOut) {
        fail(new Error(`OpenCode timed out after ${Math.round(timeoutMs / 60000)} minutes`));
        return;
      }

      settle(() => resolveProcess({ code, signal, ...output }));
    });
  });
}

async function runOpenCode(worktree, prompt, stepBudget) {
  const { GITHUB_TOKEN, GH_TOKEN, ...safeEnvironment } = process.env;
  const configuration = {
    $schema: 'https://opencode.ai/config.json',
    agents: {
      'docs-review': {
        description: 'Fact checks PR changes against hand-written documentation',
        mode: 'primary',
        steps: stepBudget,
        permissions: [
          { action: '*', resource: '*', effect: 'deny' },
          { action: 'external_directory', resource: `${worktree}/*`, effect: 'allow' },
          { action: 'read', resource: '*', effect: 'allow' },
          { action: 'glob', resource: '*', effect: 'allow' },
          { action: 'grep', resource: '*', effect: 'allow' }
        ]
      }
    }
  };

  // Async spawn on purpose: spawnSync freezes the event loop for the whole
  // review, so undici's pooled keep-alive sockets to api.github.com sit idle
  // past GitHub's server-side close and the next write fails with EPIPE.
  const result = await runOpenCodeProcess(
    [
      'run',
      '--standalone',
      '--agent',
      'docs-review',
      '--model',
      'opencode-go/deepseek-v4.1-flash',
      `Review the PR checkout at ${worktree}. Read ${resolve(worktree, '.docs-review-diff.patch')} and ${resolve(worktree, '.docs-review-images.json')} first. Resolve every repository path under this checkout.\n\n${prompt}`
    ],
    {
      cwd: worktree,
      timeoutMs: 25 * 60 * 1000,
      maxBufferBytes: 12 * 1024 * 1024,
      env: {
        ...safeEnvironment,
        PWD: worktree,
        OPENCODE_CONFIG_CONTENT: JSON.stringify(configuration),
        OPENCODE_DISABLE_PROJECT_CONFIG: '1',
        OPENCODE_DISABLE_EXTERNAL_SKILLS: '1',
        OPENCODE_PURE: '1'
      }
    }
  );

  if (result.code !== 0 || result.signal) {
    throw new Error(`OpenCode failed: ${result.stderr || result.stdout}`);
  }

  return parseReview(result.stdout);
}

async function getReplyContext(pullRequest) {
  if (process.env.REVIEW_EVENT_NAME !== 'pull_request_review_comment') return null;

  const comment = await githubRequest(`/pulls/comments/${event.comment.id}`);
  if (comment.pull_request_url !== `${apiBase}/pulls/${pullRequest.number}`) return false;
  if (!comment.in_reply_to_id || comment.user.type === 'Bot') return false;

  const root = await githubRequest(`/pulls/comments/${comment.in_reply_to_id}`);
  if (root.user.login !== botLogin || !root.body.includes(marker)) return false;

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

/**
 * Renders an error as a truncated, code-fence-safe message for a PR comment.
 */
function describeError(error) {
  const message = String(error?.message ?? error).replace(/```/g, "''").trim();
  const messageLength = 3000;

  return message.length > messageLength ? `${message.slice(0, messageLength)}…` : message;
}

/**
 * Posts the error to the PR (in the re-review thread when one exists) so a
 * tooling failure surfaces as a comment instead of only a failed job.
 */
async function postFailureNotice(pullRequest, replyContext, error) {
  const body = `${marker}\n⚠️ **Documentation fact check could not complete**\n\nThe review job hit an error, so no fact-check result was produced. Push an update to try again.\n\n\`\`\`\n${describeError(error)}\n\`\`\``;

  if (replyContext) {
    await githubRequest(`/pulls/${pullRequest.number}/comments/${replyContext.root.id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });

    return;
  }

  await githubRequest(`/issues/${pullRequest.number}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

/**
 * Posts one replyable comment per finding. Findings whose changed file is not
 * part of the PR diff (a fully reverted incremental commit) cannot receive a
 * review comment, so they fall back to a regular PR comment.
 */
async function postFindingComments(pullRequest, headSha, findings, pullRequestChangedLines) {
  for (const finding of findings) {
    const line = Number(finding.change_line);
    const changedLines = pullRequestChangedLines.get(finding.change_path);
    const hasLine = Number.isInteger(line) && changedLines?.has(line);
    const target =
      finding.kind === 'image'
        ? `**Documentation image out of date:** \`${finding.image_path}\` in \`${finding.doc_path}\``
        : `**Documentation out of date:** \`${finding.doc_path}\``;
    const body = `${marker}\n${target}\n\n${finding.explanation}`;

    if (!changedLines) {
      await githubRequest(`/issues/${pullRequest.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body })
      });
      continue;
    }

    const location = hasLine ? { line, side: 'RIGHT' } : { subject_type: 'file' };
    await githubRequest(`/pulls/${pullRequest.number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ commit_id: headSha, path: finding.change_path, ...location, body })
    });
  }
}

async function reviewPullRequest(pullRequest, replyContext) {
  gitFetch(pullRequest.base.sha);
  gitFetch(`refs/pull/${pullRequest.number}/head`);
  const headSha = git('rev-parse', 'FETCH_HEAD').trim();

  if (headSha !== pullRequest.head.sha) {
    throw new Error('PR head changed while preparing the review');
  }

  const lastCheckedSha = await getLastCheckedSha(pullRequest.number);
  const hasNewCommits = !lastCheckedSha || lastCheckedSha !== headSha;
  const isIncremental =
    hasNewCommits && Boolean(lastCheckedSha) && commitExists(lastCheckedSha) && isAncestor(lastCheckedSha, headSha);
  const reviewBaseSha = !hasNewCommits ? headSha : isIncremental ? lastCheckedSha : pullRequest.base.sha;

  if (!hasNewCommits && !replyContext) return;

  const reviewScope = diffScope(reviewBaseSha, headSha);
  const pullRequestChangedLines = isIncremental
    ? diffScope(pullRequest.base.sha, headSha).changedLines
    : reviewScope.changedLines;
  const threads = await getFactCheckThreads(pullRequest.number);
  const fallbackComments = await getFactCheckIssueComments(pullRequest.number);
  const openThreads = threads.filter((thread) => !thread.isResolved);
  const worktree = mkdtempSync(resolve(tmpdir(), 'classroomio-docs-review-'));
  let worktreeAdded = false;

  try {
    git('worktree', 'add', '--detach', worktree, headSha);
    worktreeAdded = true;
    assertContainedSymlinks(worktree);
    writeFileSync(resolve(worktree, '.docs-review-diff.patch'), reviewScope.diff, { flag: 'wx' });
    const imageInventory = buildImageInventory(worktree);
    writeFileSync(resolve(worktree, '.docs-review-images.json'), JSON.stringify(imageInventory), { flag: 'wx' });

    const instructions = readFileSync('.github/prompts/docs-fact-check.md', 'utf8');
    const scopeNote = !hasNewCommits
      ? '\nThere are no new commits since the previous fact check. Do not re-review the PR. Answer the latest reply briefly and return score 5 with no findings.\n'
      : isIncremental
        ? `\nThis check covers only the commits added since the previous fact check (${lastCheckedSha}...${headSha}). Earlier commits were already reviewed; judge the new commits and revalidate any open findings listed below.\n`
        : '';
    const revalidationCandidates = isIncremental
      ? [
          ...openThreads.map((thread) => ({
            doc_path: docPathFromThreadBody(thread.body),
            body: thread.body,
            threadId: thread.id
          })),
          ...fallbackComments.map((comment) => ({
            doc_path: comment.docPath,
            body: comment.body,
            commentId: comment.id
          }))
        ]
      : [];
    const openFindings = [];
    const revalidatedThreadIds = new Set();
    const revalidatedCommentIds = new Set();

    for (const candidate of revalidationCandidates) {
      if (!candidate.doc_path || openFindings.some((entry) => entry.doc_path === candidate.doc_path)) continue;

      openFindings.push({ doc_path: candidate.doc_path, thread: candidate.body.replace(marker, '').trim() });
      if (candidate.threadId) revalidatedThreadIds.add(candidate.threadId);
      if (candidate.commentId) revalidatedCommentIds.add(candidate.commentId);
      if (openFindings.length === 30) break;
    }

    const revalidatedDocPaths = isIncremental ? new Set(openFindings.map((finding) => finding.doc_path)) : null;
    const revalidateNote =
      openFindings.length > 0
        ? `\nThese pages were flagged earlier and are still open. Revalidate each against the current checkout and include it in findings only if it is still stale: ${JSON.stringify(openFindings)}\n`
        : '';
    const conversation = replyContext
      ? `\nRe-review requested in this existing review thread. Address the latest reply in a short \"reply\" field in your JSON. Thread: ${JSON.stringify(replyContext.thread.map((entry) => ({ author: entry.user.login, body: entry.body })))}\n`
      : '';
    const prompt = `${instructions}${scopeNote}${revalidateNote}${conversation}`;
    const stepBudget = stepBudgetFor(reviewScope.paths.length);
    let review;

    try {
      review = await runOpenCode(worktree, prompt, stepBudget);
    } catch (error) {
      if (!(error instanceof ReviewParseError)) throw error;

      review = await runOpenCode(worktree, prompt, stepBudget);
    }

    const findings = review.findings.filter(
      (finding) =>
        isDocumentationPath(finding.doc_path) &&
        existsSync(resolve(worktree, finding.doc_path)) &&
        (revalidatedDocPaths?.has(finding.doc_path) ? pullRequestChangedLines : reviewScope.changedLines).has(
          finding.change_path
        ) &&
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
    const activeDocPaths = new Set(findings.map((finding) => finding.doc_path));

    for (const image of imageInventory) {
      if (review.unverified_images.includes(image.image_path)) activeDocPaths.add(image.doc_path);
    }

    if (replyContext) {
      if (hasNewCommits && findings.length > 0) {
        await postFindingComments(pullRequest, headSha, findings, pullRequestChangedLines);
      }

      const answer =
        typeof review.reply === 'string' && review.reply.trim()
          ? review.reply.trim()
          : result.body.replace(marker, '').trim();
      const heading = hasNewCommits
        ? `${result.score === 5 ? '✅' : '📝'} **Re-review: ${result.score}/5**`
        : '💬 **Docs fact check reply**';
      const replyBody = `${marker}\n${heading}\n\n${answer}`;

      await githubRequest(`/pulls/${pullRequest.number}/comments/${replyContext.root.id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ body: hasNewCommits ? withCheckedSha(replyBody, headSha) : replyBody })
      });

      if (hasNewCommits) {
        writeResolutionPlan(
          buildResolutionPlan(threads, fallbackComments, {
            resolveAll: !isIncremental && result.score === 5,
            fullReview: !isIncremental,
            activeDocPaths,
            revalidatedThreadIds,
            revalidatedCommentIds
          })
        );
      }

      return;
    }

    const firstChangedPath = pullRequestChangedLines.keys().next().value;
    if (firstChangedPath && result.score !== 5) {
      await githubRequest(`/pulls/${pullRequest.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ commit_id: headSha, path: firstChangedPath, subject_type: 'file', body: result.body })
      });
    }

    await postFindingComments(pullRequest, headSha, findings, pullRequestChangedLines);

    await githubRequest(`/pulls/${pullRequest.number}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ commit_id: headSha, event: 'COMMENT', body: withCheckedSha(result.body, headSha) })
    });

    writeResolutionPlan(
      buildResolutionPlan(threads, fallbackComments, {
        resolveAll: !isIncremental && result.score === 5,
        fullReview: !isIncremental,
        activeDocPaths,
        revalidatedThreadIds,
        revalidatedCommentIds
      })
    );
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

async function main() {
  const pullRequestNumber = event.pull_request?.number ?? event.number;
  const pullRequest = await githubRequest(`/pulls/${pullRequestNumber}`);
  const replyContext = await getReplyContext(pullRequest);

  if (replyContext === false) return;

  try {
    await reviewPullRequest(pullRequest, replyContext);
  } catch (error) {
    console.error('Docs fact check error:', error);
    await postFailureNotice(pullRequest, replyContext, error);
  }
}

if (resolveOnly) {
  const plan = JSON.parse(readFileSync(process.env.RESOLUTION_PLAN_PATH, 'utf8'));

  await applyResolutionPlan(plan);
} else {
  writeResolutionPlan({ resolveThreadIds: [], deleteCommentIds: [] });
  await main();
}
