import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import { PostScraperError, type PostScraper, type ScrapedPost } from "../../domain/ports/post-scraper.port";

const LINKEDIN_HOST_PATTERN = /(^|\.)linkedin\.com$/i;
const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class LinkedInPostScraper implements PostScraper {
  async scrape(url: string): Promise<ScrapedPost> {
    const normalizedUrl = this.normalizeUrl(url);
    const html = await this.fetchHtml(normalizedUrl);
    return this.extractPost(html);
  }

  private normalizeUrl(url: string): string {
    const trimmedUrl = url.trim();

    try {
      const parsedUrl = new URL(trimmedUrl);

      if (
        !LINKEDIN_HOST_PATTERN.test(parsedUrl.hostname) ||
        !parsedUrl.pathname.includes("/posts/")
      ) {
        throw new PostScraperError("invalid_url", "URL no es de LinkedIn");
      }

      return parsedUrl.toString();
    } catch (error) {
      if (error instanceof PostScraperError) {
        throw error;
      }

      throw new PostScraperError("invalid_url", "URL no es de LinkedIn");
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new PostScraperError("not_found", "Post no encontrado");
      }

      if (response.status === 403) {
        throw new PostScraperError("access_denied", "Acceso denegado");
      }

      return response.text();
    } catch (error) {
      if (error instanceof PostScraperError) {
        throw error;
      }

      if (this.isAbortError(error)) {
        throw new PostScraperError("timeout", "Timeout al cargar la URL");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractPost(html: string): ScrapedPost {
    const $ = cheerio.load(html);
    const jsonLdPost = this.extractJsonLdPost($);
    const ogPost = this.extractOpenGraphPost($);

    return {
      text: jsonLdPost.text || ogPost.text,
      imageUrl: jsonLdPost.imageUrl || ogPost.imageUrl,
      title: jsonLdPost.title || ogPost.title,
      author: jsonLdPost.author,
    };
  }

  private extractJsonLdPost($: cheerio.CheerioAPI): ScrapedPost {
    const candidates: unknown[] = [];

    $('script[type="application/ld+json"]').each((_, element) => {
      const rawJson = $(element).text().trim();
      if (!rawJson) return;

      try {
        candidates.push(JSON.parse(rawJson));
      } catch {
        // LinkedIn puede incluir JSON-LD no parseable; se ignora y se usa el siguiente candidato
      }
    });

    for (const candidate of candidates.flatMap((item) => this.flattenJsonLd(item))) {
      const post = this.postFromJsonLd(candidate);
      if (post.text) return post;
    }

    return { text: "" };
  }

  private flattenJsonLd(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value.flatMap((item) => this.flattenJsonLd(item));
    }

    if (this.isJsonObject(value) && Array.isArray(value["@graph"])) {
      return value["@graph"].flatMap((item) => this.flattenJsonLd(item));
    }

    return [value];
  }

  private postFromJsonLd(value: unknown): ScrapedPost {
    if (!this.isJsonObject(value)) {
      return { text: "" };
    }

    return {
      text: this.cleanText(this.stringValue(value.articleBody)),
      imageUrl: this.stringValue(value.image),
      title: this.cleanText(this.stringValue(value.headline) || this.stringValue(value.name)),
      author: this.authorFromJsonLd(value.author),
    };
  }

  private extractOpenGraphPost($: cheerio.CheerioAPI): ScrapedPost {
    const description =
      this.metaContent($, 'meta[property="og:description"]') ||
      this.metaContent($, 'meta[name="description"]');

    return {
      text: this.cleanText(description),
      imageUrl: this.metaContent($, 'meta[property="og:image"]'),
      title: this.cleanText(this.metaContent($, 'meta[property="og:title"]')),
    };
  }

  private metaContent($: cheerio.CheerioAPI, selector: string): string | undefined {
    return this.stringValue($(selector).first().attr("content"));
  }

  private authorFromJsonLd(value: unknown): string | undefined {
    if (typeof value === "string") {
      return this.cleanText(value);
    }

    if (this.isJsonObject(value)) {
      return this.cleanText(this.stringValue(value.name));
    }

    return undefined;
  }

  private stringValue(value: unknown): string | undefined {
    if (typeof value === "string") {
      return value.trim() || undefined;
    }

    if (Array.isArray(value)) {
      const firstString = value.find((item): item is string => typeof item === "string");
      return firstString?.trim() || undefined;
    }

    if (this.isJsonObject(value)) {
      return this.stringValue(value.url);
    }

    return undefined;
  }

  private cleanText(value: string | undefined): string {
    return value?.replace(/\s+/g, " ").trim() ?? "";
  }

  private isJsonObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private isAbortError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError"
    );
  }
}
