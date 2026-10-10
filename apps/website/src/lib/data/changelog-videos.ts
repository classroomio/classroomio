/**
 * YouTube video id for each UserJot changelog entry that has a walkthrough, keyed by the UserJot entry id
 * (`id` in `GET /v1/changelogs`). UserJot's API does not return an entry's embedded video, so add a line here
 * when you publish an entry that has one.
 */
export const CHANGELOG_VIDEOS: Record<string, string> = {
  cmuv432gi15ft0kpenhk8015o: 'HojcpzwQqv4'
};
