/** Maps every item through `run`, at most `limit` at a time, keeping the input order in the result. */
export async function mapLimit<Item, Result>(
  items: readonly Item[],
  limit: number,
  run: (item: Item, index: number) => Promise<Result>
): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let next = 0;
  const work = async () => {
    for (let index = next++; index < items.length; index = next++) results[index] = await run(items[index], index);
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, work));

  return results;
}
