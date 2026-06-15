export const VISION_ANALYZER = Symbol("VisionAnalyzer");

export interface VisionAnalyzer {
  analyze(
    imageUrl: string,
    options?: { signal?: AbortSignal },
  ): Promise<string>;
}
