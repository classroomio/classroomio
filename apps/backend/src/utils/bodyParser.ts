export const getJsonBody =
  <T>(handler: (body: T, query: Record<string, string>, c: any) => Promise<Response>) =>
  async (c: any) => {
    const body = await c.req.json();
    const query = c.req.query();
    return handler(body, query, c);
  };
