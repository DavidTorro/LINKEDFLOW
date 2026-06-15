import { LinkedInPostScraper } from "./linkedin-post-scraper";

describe("LinkedInPostScraper", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("extracts text from JSON-LD and image from Open Graph", async () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://example.com/post.png" />
          <script type="application/ld+json">
            {
              "@type": "Article",
              "articleBody": "Texto completo del post de LinkedIn",
              "headline": "Título del post",
              "author": { "name": "LinkedFlow" }
            }
          </script>
        </head>
      </html>
    `;
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    ) as unknown as typeof fetch;
    const scraper = new LinkedInPostScraper();

    const result = await scraper.scrape(
      "https://www.linkedin.com/posts/example_activity-123456789/",
    );

    expect(result).toEqual({
      text: "Texto completo del post de LinkedIn",
      imageUrl: "https://example.com/post.png",
      title: "Título del post",
      author: "LinkedFlow",
    });
  });

  it("rejects non LinkedIn post URLs", async () => {
    const scraper = new LinkedInPostScraper();

    await expect(scraper.scrape("https://example.com/posts/123")).rejects.toMatchObject({
      code: "invalid_url",
      message: "URL no es de LinkedIn",
    });
  });

  it("maps request timeout to a scraper timeout error", async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn((_url: URL | RequestInfo, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;
    const scraper = new LinkedInPostScraper();

    const promise = scraper.scrape(
      "https://www.linkedin.com/posts/example_activity-123456789/",
    );

    jest.advanceTimersByTime(10_000);

    await expect(promise).rejects.toMatchObject({
      code: "timeout",
      message: "Timeout al cargar la URL",
    });
  });

  it("maps 404 responses to post not found", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(new Response("", { status: 404 })) as unknown as typeof fetch;
    const scraper = new LinkedInPostScraper();

    await expect(
      scraper.scrape("https://www.linkedin.com/posts/example_activity-123456789/"),
    ).rejects.toMatchObject({
      code: "not_found",
      message: "Post no encontrado",
    });
  });
});
