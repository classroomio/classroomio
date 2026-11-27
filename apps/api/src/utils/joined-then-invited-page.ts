export type TPageSlice<T> = { items: T[]; total: number };

/**
 * One page over two lists shown back to back: every joined row (in its own sort order) comes before every invited row.
 * Each fetcher receives an absolute row offset and a row limit; a limit of 0 only asks for its total.
 * @returns The joined and invited rows on this page, and the combined total
 */
export async function pageJoinedThenInvited<TJoined, TInvited>(params: {
  page: number;
  limit: number;
  fetchJoined: (offset: number, limit: number) => Promise<TPageSlice<TJoined>>;
  fetchInvited: (offset: number, limit: number) => Promise<TPageSlice<TInvited>>;
}): Promise<{ joined: TJoined[]; invited: TInvited[]; total: number }> {
  const start = (params.page - 1) * params.limit;
  const joined = await params.fetchJoined(start, params.limit);
  const remaining = params.limit - joined.items.length;
  const invitedOffset = Math.max(0, start - joined.total);
  const invited = await params.fetchInvited(invitedOffset, remaining);

  return { joined: joined.items, invited: invited.items, total: joined.total + invited.total };
}
