// News Sentiment Overlay — fetch RSS headlines from multiple credible public sources
// and compute basic sentiment scores.

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number; // -1 to 1
};

// Keyword-based sentiment (simple but works without ML model)
const POSITIVE_WORDS = [
  "naik", "tumbuh", "surplus", "meningkat", "positif", "optimis", "stabil",
  "recovery", "growth", "increase", "profit", "gain", "bullish", "strong",
  "membaik", "ekspansi", "rekor", "tertinggi", "menguat", "perbaikan",
  "surplus", "untung", "laba", "melonjak", "melesat", "cerah", "pulih",
  "investasi masuk", "arus modal", "cadangan naik", "pertumbuhan",
];

const NEGATIVE_WORDS = [
  "turun", "defisit", "melemah", "negatif", "pesimis", "krisis", "resesi",
  "decline", "loss", "bearish", "weak", "inflasi tinggi", "anjlok",
  "memburuk", "kontraksi", "terendah", "gagal", "default", "jatuh",
  "tekanan", "pelemahan", "perlambatan", "PHK", "pengangguran",
  "utang", "korupsi", "defisit", "stagflasi", "bubble", "crash",
  "capital outflow", "arus keluar", "cadangan turun", "tertekan",
];

function computeSentiment(text: string): { sentiment: "positive" | "negative" | "neutral"; score: number } {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE_WORDS) {
    if (lower.includes(w)) score += 0.12;
  }
  for (const w of NEGATIVE_WORDS) {
    if (lower.includes(w)) score -= 0.12;
  }
  score = Math.max(-1, Math.min(1, score));
  const sentiment = score > 0.08 ? "positive" : score < -0.08 ? "negative" : "neutral";
  return { sentiment, score };
}

/**
 * Fetch economic news from multiple credible public RSS feeds.
 * Uses rss2json.com (free tier, no key needed for small volume) as CORS proxy.
 */
const RSS_FEEDS = [
  // Indonesian economic news sources
  { url: "https://www.cnbcindonesia.com/economy/rss", source: "CNBC Indonesia" },
  { url: "https://ekonomi.bisnis.com/rss", source: "Bisnis.com" },
  { url: "https://www.kompas.com/rss/ekonomi", source: "Kompas Ekonomi" },
  { url: "https://finance.detik.com/rss", source: "Detik Finance" },
  { url: "https://www.liputan6.com/rss/bisnis", source: "Liputan6 Bisnis" },
  { url: "https://www.tempo.co/rss/bisnis", source: "Tempo Bisnis" },
  { url: "https://katadata.co.id/rss/finansial", source: "Katadata" },
  { url: "https://www.kontan.co.id/rss/ekonomi", source: "Kontan" },
  // International sources for broader context
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml", source: "NYT Economy" },
  { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters Business" },
  { url: "https://www.ft.com/rss/home/asia", source: "Financial Times Asia" },
];

const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

export async function fetchNewsSentiment(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  // Fetch all feeds in parallel for speed
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`);
      if (!res.ok) return [];
      const json = await res.json() as {
        status: string;
        items?: Array<{ title: string; link: string; pubDate: string }>;
      };
      if (json.status !== "ok" || !json.items) return [];

      return json.items.slice(0, 5).map((item) => {
        const { sentiment, score } = computeSentiment(item.title);
        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: feed.source,
          sentiment,
          score,
        } as NewsItem;
      });
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allItems.push(...result.value);
    }
  }

  return allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

export function aggregateSentiment(items: NewsItem[]): {
  avg: number;
  label: string;
  positive: number;
  negative: number;
  neutral: number;
  sourceCount: number;
} {
  if (items.length === 0) return { avg: 0, label: "Tidak ada data", positive: 0, negative: 0, neutral: 0, sourceCount: 0 };
  const avg = items.reduce((s, i) => s + i.score, 0) / items.length;
  const positive = items.filter((i) => i.sentiment === "positive").length;
  const negative = items.filter((i) => i.sentiment === "negative").length;
  const neutral = items.filter((i) => i.sentiment === "neutral").length;
  const sourceCount = new Set(items.map((i) => i.source)).size;
  const label = avg > 0.08 ? "Optimis" : avg < -0.08 ? "Pesimis" : "Netral";
  return { avg, label, positive, negative, neutral, sourceCount };
}
