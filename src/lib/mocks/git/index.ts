import gitNewFiles from './001_git_newFiles';
import gitStaging from './002_git_staging';
import gitCommit from './003_git_commit';
import gitAmend from './004_git_amend';
import gitBranch from './005_git_branch';
import gitBranchMerge from './006_git_branchMerge';
import gitPull from './007_git_pull';
import gitPush from './008_git_push';
import gitGithubBranch from './009_git_githubBranch';
import gitBranchPull from './010_git_branchPull';
import gitBranchPush from './011_git_branchPush';
import gitGithubFlow from './012_git_githubFlow';
import gitGithubPages from './013_git_githubPages';
import gitGithubFork from './014_git_githubFork';
import gitClone from './015_git_clone';
import gitPullRequest from './016_git_pullRequest';
import gitIgnore from './017_git_ignore';
import gitSsh from './018_gitSsh';
import gitRevert from './019_git_revert';
import gitReset from './020_git_reset';

export const GIT_IDS: { [key: string]: string } = {
  GIT_NEWFILES: 'GIT_NEWFILES',
  GIT_STAGING: 'GIT_STAGING',
  GIT_COMMIT: 'GIT_COMMIT',
  GIT_AMEND: 'GIT_AMEND',
  GIT_BRANCH: 'GIT_BRANCH',
  GIT_BRANCHMERGE: 'GIT_BRANCHMERGE',
  GIT_PULL: 'GIT_PULL',
  GIT_PUSH: 'GIT_PUSH',
  GIT_GITHUBBRANCH: 'GIT_GITHUBBRANCH',
  GIT_BRANCHPULL: 'GIT_BRANCHPULL',
  GIT_BRANCHPUSH: 'GIT_BRANCHPUSH',
  GIT_GITHUBFLOW: 'GIT_GITHUBFLOW',
  GIT_GITHUBPAGES: 'GIT_GITHUBPAGES',
  GIT_GITHUBFORK: 'GIT_GITHUBFORK',
  GIT_CLONE: 'GIT_CLONE',
  GIT_PULLREQUEST: 'GIT_PULLREQUEST',
  GIT_IGNORE: 'GIT_IGNORE',
  GIT_SSH: 'GIT_SSH',
  GIT_REVERT: 'GIT_REVERT',
  GIT_RESET: 'GIT_RESET'
};

export const GIT_TEMPLATES = {
  [GIT_IDS.GIT_NEWFILES]: gitNewFiles,
  [GIT_IDS.GIT_STAGING]: gitStaging,
  [GIT_IDS.GIT_COMMIT]: gitCommit,
  [GIT_IDS.GIT_AMEND]: gitAmend,
  [GIT_IDS.GIT_BRANCH]: gitBranch,
  [GIT_IDS.GIT_BRANCHMERGE]: gitBranchMerge,
  [GIT_IDS.GIT_PULL]: gitPull,
  [GIT_IDS.GIT_PUSH]: gitPush,
  [GIT_IDS.GIT_GITHUBBRANCH]: gitGithubBranch,
  [GIT_IDS.GIT_BRANCHPULL]: gitBranchPull,
  [GIT_IDS.GIT_BRANCHPUSH]: gitBranchPush,
  [GIT_IDS.GIT_GITHUBFLOW]: gitGithubFlow,
  [GIT_IDS.GIT_GITHUBPAGES]: gitGithubPages,
  [GIT_IDS.GIT_GITHUBFORK]: gitGithubFork,
  [GIT_IDS.GIT_CLONE]: gitClone,
  [GIT_IDS.GIT_PULLREQUEST]: gitPullRequest,
  [GIT_IDS.GIT_IGNORE]: gitIgnore,
  [GIT_IDS.GIT_SSH]: gitSsh,
  [GIT_IDS.GIT_REVERT]: gitRevert,
  [GIT_IDS.GIT_RESET]: gitReset,
};
