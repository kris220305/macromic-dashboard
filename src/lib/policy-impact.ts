// Policy Impact Engine — real-time tracking of government policies, regulations,
// corruption cases, and political-economic events that affect economic indicators.
//
// Sources (all public, no API key):
//   - RSS feeds from official government sites & credible news
//   - rss2json.com as CORS proxy
//
// Refresh: every 30 minutes

export type PolicyCategory =
  | "FISKAL"        // APBN, pajak, subsidi
  | "MONETER"       // BI Rate, likuiditas
  | "PERDAGANGAN"   // ekspor/impor, tarif
  | "SOSIAL"        // MBG, bansos, pendidikan
  | "INFRASTRUKTUR" // proyek, konstruksi
  | "REGULASI"      // UU, PP, Perpres
  | "KORUPSI"       // kasus korupsi anggaran
  | "POLITIK"       // reshuffle, pemilu
  | "ENERGI"        // BBM, listrik, EBT
  | "PANGAN"        // harga pangan, distribusi
  | "KETENAGAKERJAAN"; // UMR, PHK, TKA

export type ImpactLevel = "HIGH" | "MEDIUM" | "LOW";
export type ImpactDirection = "POSITIVE" | "NEGATIVE" | "MIXED";

export type AffectedIndicator = {
  code: string;
  name: string;
  impactPct: number;       // estimated % impact (-100 to +100)
  mechanism: string;       // how this policy affects the indicator
  timeframe: string;       // when impact is expected
};

export type PolicyEvent = {
  id: string;
  title: string;
  summary: string;
  category: PolicyCategory;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  impactLevel: ImpactLevel;
  impactDirection: ImpactDirection;
  affectedIndicators: AffectedIndicator[];
  region: string;          // "Nasional" or specific province
  budgetImpact: string | null; // e.g. "Rp71T" for MBG
  tags: string[];
};

// ─── Keyword-based policy classification & impact estimation ───────────────

const CATEGORY_KEYWORDS: Record<PolicyCategory, string[]> = {
  FISKAL: ["apbn", "pajak", "ppn", "pph", "cukai", "subsidi", "anggaran", "defisit fiskal", "belanja negara", "pendapatan negara", "sri mulyani", "kemenkeu"],
  MONETER: ["bi rate", "suku bunga", "bank indonesia", "likuiditas", "inflasi target", "operasi pasar", "giro wajib minimum", "perry warjiyo"],
  PERDAGANGAN: ["ekspor", "impor", "tarif", "bea masuk", "neraca perdagangan", "free trade", "rcep", "dumping", "safeguard"],
  SOSIAL: ["mbg", "makan bergizi", "bansos", "blt", "pkh", "kartu prakerja", "pendidikan gratis", "kesehatan gratis", "jaminan sosial", "bpjs"],
  INFRASTRUKTUR: ["ikn", "nusantara", "tol", "bandara", "pelabuhan", "kereta cepat", "mrt", "lrt", "bendungan", "pupr"],
  REGULASI: ["undang-undang", "peraturan pemerintah", "perpres", "perpu", "omnibus", "cipta kerja", "dpr", "ruu"],
  KORUPSI: ["korupsi", "suap", "gratifikasi", "kpk", "tersangka", "terdakwa", "kerugian negara", "mark up", "penggelapan", "pencucian uang"],
  POLITIK: ["reshuffle", "kabinet", "menteri", "presiden", "pemilu", "pilkada", "partai", "koalisi", "oposisi"],
  ENERGI: ["bbm", "pertamina", "pln", "listrik", "ebt", "energi terbarukan", "solar", "pertalite", "harga bbm", "gas"],
  PANGAN: ["beras", "cabai", "bawang", "gula", "minyak goreng", "bulog", "harga pangan", "panen", "gagal panen", "el nino", "la nina"],
  KETENAGAKERJAAN: ["umr", "ump", "umk", "phk", "tenaga kerja", "tka", "outsourcing", "buruh", "serikat pekerja", "upah minimum"],
};

const INDICATOR_IMPACT_MAP: Record<PolicyCategory, AffectedIndicator[]> = {
  FISKAL: [
    { code: "GDP", name: "GDP Growth", impactPct: 0.5, mechanism: "Belanja pemerintah langsung menambah komponen G dalam GDP", timeframe: "1-2 kuartal" },
    { code: "INFLASI", name: "Inflasi", impactPct: 0.3, mechanism: "Subsidi menekan harga, pajak baru menaikkan harga", timeframe: "1-3 bulan" },
    { code: "KURS_USD", name: "Kurs USD/IDR", impactPct: -0.2, mechanism: "Defisit fiskal tinggi melemahkan kepercayaan investor", timeframe: "Segera" },
  ],
  MONETER: [
    { code: "INFLASI", name: "Inflasi", impactPct: -0.8, mechanism: "Kenaikan BI Rate menekan permintaan agregat → inflasi turun", timeframe: "3-6 bulan" },
    { code: "KURS_USD", name: "Kurs USD/IDR", impactPct: -1.0, mechanism: "Rate naik → yield menarik → capital inflow → Rupiah menguat", timeframe: "Segera - 1 bulan" },
    { code: "KREDIT", name: "Pertumbuhan Kredit", impactPct: -1.5, mechanism: "Bunga naik → kredit mahal → pertumbuhan kredit melambat", timeframe: "1-3 bulan" },
  ],
  PERDAGANGAN: [
    { code: "KURS_USD", name: "Kurs USD/IDR", impactPct: 0.5, mechanism: "Surplus perdagangan → supply USD naik → Rupiah menguat", timeframe: "Segera" },
    { code: "GDP", name: "GDP Growth", impactPct: 0.3, mechanism: "Net ekspor positif menambah GDP", timeframe: "1 kuartal" },
    { code: "CADANGAN_DEVISA", name: "Cadangan Devisa", impactPct: 0.4, mechanism: "Surplus menambah cadangan devisa BI", timeframe: "1 bulan" },
  ],
  SOSIAL: [
    { code: "KONSUMSI", name: "Konsumsi RT", impactPct: 0.8, mechanism: "Transfer sosial meningkatkan daya beli masyarakat bawah", timeframe: "Segera - 1 bulan" },
    { code: "GDP", name: "GDP Growth", impactPct: 0.3, mechanism: "Konsumsi RT = 55% GDP, kenaikan konsumsi mendorong pertumbuhan", timeframe: "1 kuartal" },
    { code: "KEMISKINAN", name: "Tingkat Kemiskinan", impactPct: -0.5, mechanism: "Bansos langsung mengurangi jumlah penduduk di bawah garis kemiskinan", timeframe: "6-12 bulan" },
    { code: "INFLASI", name: "Inflasi Pangan", impactPct: 0.4, mechanism: "Program MBG meningkatkan demand pangan → harga naik jika supply tidak siap", timeframe: "1-3 bulan" },
  ],
  INFRASTRUKTUR: [
    { code: "GDP", name: "GDP Growth", impactPct: 1.0, mechanism: "Belanja infrastruktur = multiplier effect tinggi (1.5-2x)", timeframe: "1-2 kuartal" },
    { code: "PENGANGGURAN", name: "Pengangguran", impactPct: -0.5, mechanism: "Proyek infrastruktur menyerap tenaga kerja langsung", timeframe: "Segera" },
    { code: "INFLASI", name: "Inflasi", impactPct: 0.2, mechanism: "Demand material konstruksi naik → harga naik", timeframe: "1-3 bulan" },
  ],
  REGULASI: [
    { code: "FDI", name: "FDI Inflows", impactPct: 0.5, mechanism: "Regulasi pro-bisnis menarik investasi asing", timeframe: "6-12 bulan" },
    { code: "GDP", name: "GDP Growth", impactPct: 0.3, mechanism: "Kemudahan berusaha mendorong aktivitas ekonomi", timeframe: "6-12 bulan" },
    { code: "PENGANGGURAN", name: "Pengangguran", impactPct: -0.3, mechanism: "Investasi baru menciptakan lapangan kerja", timeframe: "6-12 bulan" },
  ],
  KORUPSI: [
    { code: "GDP", name: "GDP Growth", impactPct: -0.2, mechanism: "Kebocoran anggaran mengurangi efektivitas belanja publik", timeframe: "1-2 kuartal" },
    { code: "FDI", name: "FDI Inflows", impactPct: -0.5, mechanism: "Korupsi menurunkan kepercayaan investor & meningkatkan biaya bisnis", timeframe: "3-6 bulan" },
    { code: "KEMISKINAN", name: "Tingkat Kemiskinan", impactPct: 0.3, mechanism: "Dana yang seharusnya untuk rakyat tidak sampai", timeframe: "6-12 bulan" },
    { code: "KURS_USD", name: "Kurs USD/IDR", impactPct: 0.1, mechanism: "Sentimen negatif → capital outflow ringan", timeframe: "Segera" },
  ],
  POLITIK: [
    { code: "IHSG", name: "IHSG", impactPct: -0.5, mechanism: "Ketidakpastian politik → investor wait-and-see → IHSG tertekan", timeframe: "Segera" },
    { code: "KURS_USD", name: "Kurs USD/IDR", impactPct: 0.3, mechanism: "Instabilitas politik → capital outflow → Rupiah melemah", timeframe: "Segera" },
    { code: "FDI", name: "FDI Inflows", impactPct: -0.3, mechanism: "Investor asing menunda keputusan investasi", timeframe: "3-6 bulan" },
  ],
  ENERGI: [
    { code: "INFLASI", name: "Inflasi", impactPct: 1.5, mechanism: "Kenaikan BBM → ongkos transportasi naik → harga barang naik (second round effect)", timeframe: "Segera - 1 bulan" },
    { code: "KONSUMSI", name: "Konsumsi RT", impactPct: -0.5, mechanism: "Biaya energi naik → daya beli turun → konsumsi berkurang", timeframe: "1 bulan" },
    { code: "GDP", name: "GDP Growth", impactPct: -0.2, mechanism: "Biaya produksi naik → output berkurang", timeframe: "1-2 kuartal" },
  ],
  PANGAN: [
    { code: "INFLASI", name: "Inflasi (Volatile Food)", impactPct: 2.0, mechanism: "Harga pangan langsung masuk komponen IHK dengan bobot ~20%", timeframe: "Segera" },
    { code: "KONSUMSI", name: "Konsumsi RT", impactPct: -0.3, mechanism: "Harga pangan naik → porsi belanja makanan naik → belanja non-makanan turun", timeframe: "Segera" },
    { code: "KEMISKINAN", name: "Tingkat Kemiskinan", impactPct: 0.5, mechanism: "Kenaikan harga pangan paling memukul masyarakat miskin", timeframe: "1-3 bulan" },
  ],
  KETENAGAKERJAAN: [
    { code: "KONSUMSI", name: "Konsumsi RT", impactPct: 0.4, mechanism: "Kenaikan UMR → pendapatan pekerja naik → konsumsi naik", timeframe: "1-3 bulan" },
    { code: "INFLASI", name: "Inflasi", impactPct: 0.3, mechanism: "Upah naik → biaya produksi naik → harga naik (wage-push inflation)", timeframe: "3-6 bulan" },
    { code: "PENGANGGURAN", name: "Pengangguran", impactPct: 0.2, mechanism: "UMR terlalu tinggi → perusahaan kurangi pekerja / otomasi", timeframe: "6-12 bulan" },
  ],
};

function classifyCategory(text: string): PolicyCategory {
  const lower = text.toLowerCase();
  let bestCategory: PolicyCategory = "REGULASI";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as PolicyCategory;
    }
  }
  return bestCategory;
}

function classifyImpactLevel(text: string): ImpactLevel {
  const lower = text.toLowerCase();
  const highKeywords = ["triliun", "miliar dolar", "nasional", "seluruh", "darurat", "krisis", "korupsi besar", "mega"];
  const medKeywords = ["miliar", "provinsi", "signifikan", "penting", "berdampak"];
  if (highKeywords.some((k) => lower.includes(k))) return "HIGH";
  if (medKeywords.some((k) => lower.includes(k))) return "MEDIUM";
  return "LOW";
}

function classifyDirection(text: string, category: PolicyCategory): ImpactDirection {
  const lower = text.toLowerCase();
  const negativeKeywords = ["korupsi", "suap", "kerugian", "gagal", "defisit", "melemah", "turun", "phk", "krisis", "bencana"];
  const positiveKeywords = ["surplus", "naik", "tumbuh", "berhasil", "investasi masuk", "bantuan", "subsidi", "gratis"];
  const negScore = negativeKeywords.filter((k) => lower.includes(k)).length;
  const posScore = positiveKeywords.filter((k) => lower.includes(k)).length;
  if (category === "KORUPSI") return "NEGATIVE";
  if (negScore > posScore) return "NEGATIVE";
  if (posScore > negScore) return "POSITIVE";
  return "MIXED";
}

function estimateAffectedIndicators(category: PolicyCategory, title: string, impactLevel: ImpactLevel): AffectedIndicator[] {
  const base = INDICATOR_IMPACT_MAP[category] ?? [];
  const multiplier = impactLevel === "HIGH" ? 2.0 : impactLevel === "MEDIUM" ? 1.0 : 0.5;
  return base.map((ind) => ({
    ...ind,
    impactPct: Number((ind.impactPct * multiplier).toFixed(2)),
  }));
}

function extractRegion(text: string): string {
  const lower = text.toLowerCase();
  const provinces = [
    "aceh", "sumut", "sumbar", "riau", "jambi", "sumsel", "bengkulu", "lampung",
    "babel", "kepri", "dki jakarta", "jakarta", "jabar", "jateng", "diy", "jatim",
    "banten", "bali", "ntb", "ntt", "kalbar", "kalteng", "kalsel", "kaltim", "kaltara",
    "sulut", "sulteng", "sulsel", "sultra", "gorontalo", "sulbar",
    "maluku", "malut", "papua", "papua barat",
  ];
  for (const prov of provinces) {
    if (lower.includes(prov)) return prov.charAt(0).toUpperCase() + prov.slice(1);
  }
  return "Nasional";
}

function extractBudget(text: string): string | null {
  const match = text.match(/Rp\s?[\d.,]+\s?(triliun|miliar|juta|T|M)/i);
  if (match) return match[0];
  const match2 = text.match(/(\d+[.,]?\d*)\s?(triliun|miliar)/i);
  if (match2) return `Rp${match2[1]} ${match2[2]}`;
  return null;
}

// ─── RSS Feed Sources ──────────────────────────────────────────────────────

const POLICY_RSS_FEEDS = [
  // Government & official
  { url: "https://www.kemenkeu.go.id/api/rss", source: "Kemenkeu RI" },
  { url: "https://www.bi.go.id/id/publikasi/ruang-media/siaran-pers/Default.aspx", source: "Bank Indonesia" },
  // Major credible news
  { url: "https://www.cnbcindonesia.com/news/rss", source: "CNBC Indonesia" },
  { url: "https://nasional.kompas.com/rss", source: "Kompas Nasional" },
  { url: "https://www.kompas.com/rss/ekonomi", source: "Kompas Ekonomi" },
  { url: "https://finance.detik.com/rss", source: "Detik Finance" },
  { url: "https://nasional.tempo.co/rss", source: "Tempo Nasional" },
  { url: "https://www.tempo.co/rss/bisnis", source: "Tempo Bisnis" },
  { url: "https://ekonomi.bisnis.com/rss", source: "Bisnis.com" },
  { url: "https://www.kontan.co.id/rss/nasional", source: "Kontan Nasional" },
  { url: "https://www.liputan6.com/rss/news", source: "Liputan6 News" },
  { url: "https://katadata.co.id/rss/berita", source: "Katadata" },
  { url: "https://www.antaranews.com/rss/ekonomi-bisnis", source: "Antara" },
  { url: "https://www.tribunnews.com/rss/bisnis", source: "Tribun Bisnis" },
];

const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

// Policy-relevant keywords to filter news
const POLICY_FILTER_KEYWORDS = [
  "kebijakan", "peraturan", "undang-undang", "perpres", "pp ", "permen",
  "anggaran", "apbn", "apbd", "subsidi", "pajak", "cukai",
  "bi rate", "suku bunga", "bank indonesia",
  "korupsi", "suap", "kpk", "kerugian negara",
  "mbg", "makan bergizi", "bansos", "blt",
  "bbm", "listrik", "tarif",
  "umr", "ump", "phk", "tenaga kerja",
  "ekspor", "impor", "tarif bea",
  "investasi", "fdi", "perizinan",
  "infrastruktur", "ikn", "tol", "proyek",
  "harga beras", "harga cabai", "harga pangan",
  "reshuffle", "menteri", "kabinet",
  "omnibus", "cipta kerja",
  "dana desa", "transfer daerah",
  "defisit", "surplus", "utang",
];

function isPolicyRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return POLICY_FILTER_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function fetchPolicyEvents(): Promise<PolicyEvent[]> {
  const allEvents: PolicyEvent[] = [];

  const results = await Promise.allSettled(
    POLICY_RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`);
        if (!res.ok) return [];
        const json = await res.json() as {
          status: string;
          items?: Array<{ title: string; link: string; pubDate: string; description?: string }>;
        };
        if (json.status !== "ok" || !json.items) return [];

        return json.items
          .filter((item) => isPolicyRelevant(item.title))
          .slice(0, 5)
          .map((item): PolicyEvent => {
            const fullText = `${item.title} ${item.description ?? ""}`;
            const category = classifyCategory(fullText);
            const impactLevel = classifyImpactLevel(fullText);
            const direction = classifyDirection(fullText, category);
            const affected = estimateAffectedIndicators(category, item.title, impactLevel);
            const region = extractRegion(fullText);
            const budget = extractBudget(fullText);

            return {
              id: `${feed.source}-${item.pubDate}-${item.title.slice(0, 20)}`.replace(/\s/g, "-"),
              title: item.title,
              summary: (item.description ?? "").replace(/<[^>]*>/g, "").slice(0, 300),
              category,
              source: feed.source,
              sourceUrl: item.link,
              publishedAt: item.pubDate,
              impactLevel,
              impactDirection: direction,
              affectedIndicators: affected,
              region,
              budgetImpact: budget,
              tags: [category, impactLevel, direction, region].filter(Boolean),
            };
          });
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allEvents.push(...result.value);
    }
  }

  // Sort by date (newest first) and deduplicate by similar titles
  const sorted = allEvents.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Simple dedup: skip if title is >80% similar to previous
  const deduped: PolicyEvent[] = [];
  for (const event of sorted) {
    const isDupe = deduped.some((e) => {
      const overlap = event.title.split(" ").filter((w) => e.title.includes(w)).length;
      return overlap / event.title.split(" ").length > 0.8;
    });
    if (!isDupe) deduped.push(event);
  }

  return deduped.slice(0, 50); // Cap at 50 events
}

// Category display info
export const CATEGORY_INFO: Record<PolicyCategory, { label: string; emoji: string; color: string }> = {
  FISKAL: { label: "Fiskal", emoji: "💰", color: "text-chart-1" },
  MONETER: { label: "Moneter", emoji: "🏦", color: "text-chart-2" },
  PERDAGANGAN: { label: "Perdagangan", emoji: "🚢", color: "text-chart-3" },
  SOSIAL: { label: "Sosial", emoji: "🤝", color: "text-primary" },
  INFRASTRUKTUR: { label: "Infrastruktur", emoji: "🏗️", color: "text-chart-5" },
  REGULASI: { label: "Regulasi", emoji: "📜", color: "text-muted-foreground" },
  KORUPSI: { label: "Korupsi", emoji: "🚨", color: "text-destructive" },
  POLITIK: { label: "Politik", emoji: "🏛️", color: "text-warning" },
  ENERGI: { label: "Energi", emoji: "⚡", color: "text-chart-4" },
  PANGAN: { label: "Pangan", emoji: "🌾", color: "text-success" },
  KETENAGAKERJAAN: { label: "Ketenagakerjaan", emoji: "👷", color: "text-chart-2" },
};
