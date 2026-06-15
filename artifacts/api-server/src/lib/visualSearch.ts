import { logger } from "./logger";

export interface SearchResult {
  id: string;
  url: string;
  title: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  confidence: number;
  source: string;
  providerName: string;
  pageTitle: string | null;
  siteName: string | null;
  matchType: "exact" | "similar" | "partial";
}

export interface ProviderResult {
  providerId: string;
  providerName: string;
  status: "success" | "failed" | "skipped";
  resultCount: number;
  processingTimeMs: number | null;
  error: string | null;
}

interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
}

// Simulated search engine results — in production replace with real API calls
async function runGoogleLens(imageUrl: string): Promise<SearchResult[]> {
  await delay(800 + Math.random() * 1200);
  return generateMockResults("google_lens", "Google Lens", imageUrl, 8);
}

async function runBingVisual(imageUrl: string): Promise<SearchResult[]> {
  await delay(600 + Math.random() * 900);
  return generateMockResults("bing_visual", "Bing Visual Search", imageUrl, 6);
}

async function runTinEye(imageUrl: string): Promise<SearchResult[]> {
  await delay(1000 + Math.random() * 1500);
  return generateMockResults("tineye", "TinEye", imageUrl, 4);
}

async function runYandex(imageUrl: string): Promise<SearchResult[]> {
  await delay(700 + Math.random() * 1000);
  return generateMockResults("yandex", "Yandex Images", imageUrl, 5);
}

async function runGeminiVision(imageUrl: string): Promise<SearchResult[]> {
  await delay(1500 + Math.random() * 2000);
  return generateMockResults("gemini_vision", "Gemini Vision", imageUrl, 3);
}

async function runOpenAIVision(imageUrl: string): Promise<SearchResult[]> {
  await delay(2000 + Math.random() * 2500);
  return generateMockResults("openai_vision", "OpenAI Vision", imageUrl, 3);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const DOMAINS = [
  "wikipedia.org", "reddit.com", "instagram.com", "twitter.com", "flickr.com",
  "pinterest.com", "imgur.com", "unsplash.com", "pexels.com", "shutterstock.com",
  "gettyimages.com", "stockphoto.com", "pixabay.com", "adobe.com", "500px.com",
];

const MATCH_TYPES: Array<"exact" | "similar" | "partial"> = ["exact", "similar", "partial"];

function generateMockResults(providerId: string, providerName: string, _imageUrl: string, count: number): SearchResult[] {
  return Array.from({ length: count }, (_, i) => {
    const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    const matchType = MATCH_TYPES[i === 0 ? 0 : i === 1 ? 1 : 2];
    const confidence = matchType === "exact" ? 0.85 + Math.random() * 0.15
      : matchType === "similar" ? 0.5 + Math.random() * 0.35
      : 0.2 + Math.random() * 0.3;
    return {
      id: `${providerId}_${i}_${Date.now()}`,
      url: `https://${domain}/page/${Math.random().toString(36).slice(2, 8)}`,
      title: `Image found on ${domain}`,
      imageUrl: `https://${domain}/images/${Math.random().toString(36).slice(2, 8)}.jpg`,
      thumbnailUrl: `https://${domain}/thumbnails/${Math.random().toString(36).slice(2, 8)}.jpg`,
      confidence,
      source: domain,
      providerName,
      pageTitle: `Page from ${domain}`,
      siteName: domain,
      matchType,
    };
  });
}

const PROVIDER_RUNNERS: Record<string, (url: string) => Promise<SearchResult[]>> = {
  google_lens: runGoogleLens,
  bing_visual: runBingVisual,
  tineye: runTinEye,
  yandex: runYandex,
  gemini_vision: runGeminiVision,
  openai_vision: runOpenAIVision,
};

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    const key = r.url.toLowerCase().replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankResults(results: SearchResult[]): SearchResult[] {
  return [...results].sort((a, b) => b.confidence - a.confidence);
}

export async function runVisualSearch(
  imageUrl: string,
  providers: ProviderConfig[],
): Promise<{ results: SearchResult[]; providerResults: ProviderResult[] }> {
  const enabledProviders = providers.filter(p => p.enabled);
  logger.info({ count: enabledProviders.length }, "Starting parallel visual search");

  const providerResultsMap: ProviderResult[] = [];
  const allResults: SearchResult[] = [];

  const tasks = enabledProviders.map(async (provider) => {
    const start = Date.now();
    const runner = PROVIDER_RUNNERS[provider.id];
    if (!runner) {
      providerResultsMap.push({
        providerId: provider.id,
        providerName: provider.name,
        status: "skipped",
        resultCount: 0,
        processingTimeMs: null,
        error: "Provider not implemented",
      });
      return;
    }
    try {
      const results = await runner(imageUrl);
      const elapsed = Date.now() - start;
      allResults.push(...results);
      providerResultsMap.push({
        providerId: provider.id,
        providerName: provider.name,
        status: "success",
        resultCount: results.length,
        processingTimeMs: elapsed,
        error: null,
      });
    } catch (err) {
      providerResultsMap.push({
        providerId: provider.id,
        providerName: provider.name,
        status: "failed",
        resultCount: 0,
        processingTimeMs: Date.now() - start,
        error: String(err),
      });
    }
  });

  await Promise.all(tasks);

  const deduplicated = deduplicateResults(allResults);
  const ranked = rankResults(deduplicated);

  return { results: ranked, providerResults: providerResultsMap };
}
