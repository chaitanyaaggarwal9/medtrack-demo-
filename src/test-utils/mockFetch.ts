/** A tiny fake for window.fetch: answers by "METHOD /path" in order. */
type Reply = { status: number; body?: unknown };
type Route = (url: string, init?: RequestInit) => Reply | undefined;

export function mockFetch(...routes: Route[]) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      for (const route of routes) {
        const reply = route(url, init);
        if (reply) {
          return new Response(
            reply.body === undefined ? null : JSON.stringify(reply.body),
            {
              status: reply.status,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      }
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
      });
    },
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Matches a method and a path prefix. */
export const on =
  (
    method: string,
    path: string,
    reply: Reply | ((init?: RequestInit) => Reply),
  ): Route =>
  (url, init) => {
    if ((init?.method ?? 'GET') !== method || !url.startsWith(path))
      return undefined;
    return typeof reply === 'function' ? reply(init) : reply;
  };

/** The JSON body a request sent. */
export const sentBody = (
  fetchMock: ReturnType<typeof mockFetch>,
  index: number,
): unknown => JSON.parse(String(fetchMock.mock.calls[index]?.[1]?.body));
