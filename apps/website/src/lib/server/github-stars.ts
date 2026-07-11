const GITHUB_REPO_URL = 'https://api.github.com/repos/classroomio/classroomio';
const CACHE_TTL_MS = 1000 * 60 * 60 * 3;

const starsCache = {
  stars: 0,
  lastUpdated: 0
};

let inFlightFetch: Promise<number> | null = null;

function isCacheFresh(now: number) {
  return starsCache.lastUpdated > 0 && now - starsCache.lastUpdated < CACHE_TTL_MS;
}

export async function getGithubStars(): Promise<number> {
  const now = Date.now();

  if (isCacheFresh(now)) {
    return starsCache.stars;
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = fetchGithubStars(now).finally(() => {
    inFlightFetch = null;
  });

  return inFlightFetch;
}

async function fetchGithubStars(now: number): Promise<number> {
  try {
    const response = await fetch(GITHUB_REPO_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'classroomio-website'
      }
    });

    if (!response.ok) {
      console.error('getGithubStars error: GitHub API returned', response.status);

      if (starsCache.lastUpdated > 0) {
        return starsCache.stars;
      }

      return 0;
    }

    const data = await response.json();
    const stars = typeof data?.stargazers_count === 'number' ? data.stargazers_count : 0;

    starsCache.stars = stars;
    starsCache.lastUpdated = now;

    return stars;
  } catch (error) {
    console.error('getGithubStars error:', error);

    if (starsCache.lastUpdated > 0) {
      return starsCache.stars;
    }

    return 0;
  }
}
