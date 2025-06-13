export const getJsonBody =
  <T>(handler: (body: T, c: any) => Promise<Response>) =>
  async (c: any) => {
    const body = await c.req.json();
    return handler(body, c);
  };
