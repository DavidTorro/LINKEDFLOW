export const POST_SCRAPER = Symbol("PostScraper");

export interface ScrapedPost {
  text: string;
  imageUrl?: string;
  title?: string;
  author?: string;
}

export interface PostScraper {
  scrape(url: string): Promise<ScrapedPost>;
}

export type PostScraperErrorCode =
  | "invalid_url"
  | "not_found"
  | "access_denied"
  | "timeout";

export class PostScraperError extends Error {
  constructor(
    readonly code: PostScraperErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PostScraperError";
  }
}
