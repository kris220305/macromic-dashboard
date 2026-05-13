// AI Assistant — interactive economic analyst for Macromic dashboard.
//
// Strategy:
//   1. If user has a Gemini API key → call Gemini with full context + general economics knowledge
//   2. Without key → enhanced local analyst that can answer general economics questions
//
// Topic boundary: Only answers questions related to economics, finance, markets.
// Politely declines off-topic questions.

import type { Indicator, CausalRelation, Insight } from "@/lib/dashboard";
import type { LiveIndicator } from "@/lib/live-data";

export type AssistantContext = {
  indicators: Indicator[];
  insights: Insight[];
  relations: CausalRelation[];
  live: LiveIndicator[];
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const KEY_STORAGE = "MACROMIC_GEMINI_KEY";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_STORAGE);
}

export function setStoredApiKey(key: string | null) {
  if (typeof window === "undefined") return;
  if (!key) window.localStorage.removeItem(KEY_STORAGE);
  else window.localStorage.setItem(KEY_STORAGE, key);
}

/* -----------------------------------------------------------------------
 * Topic guard — only allow economics-related questions
 * --------------------------------------------------------------------- */

const ECONOMICS_KEYWORDS = [
  "ekonomi", "inflasi", "deflasi", "gdp", "pdb", "pertumbuhan", "resesi",
  "kurs", "rupiah", "dolar", "usd", "valas", "forex", "devisa",
  "bi rate", "suku bunga", "bunga", "moneter", "fiskal", "apbn",
  "saham", "ihsg", "obligasi", "sbn", "investasi", "reksadana",
  "ekspor", "impor", "neraca", "perdagangan", "tarif", "bea",
  "pengangguran", "tenaga kerja", "upah", "umr", "phk",
  "pajak", "ppn", "pph", "cukai", "subsidi",
  "bank", "kredit", "deposito", "fintech", "pinjaman",
  "harga", "komoditas", "minyak", "emas", "batu bara", "cpo", "nikel",
  "properti", "konstruksi", "infrastruktur",
  "kemiskinan", "ketimpangan", "gini",
  "utang", "debt", "bond", "yield",
  "the fed", "ecb", "boj", "tapering", "quantitative",
  "supply", "demand", "pasar", "market",
  "startup", "unicorn", "ipo", "emiten",
  "crypto", "bitcoin", "blockchain",
  "asean", "apec", "g20", "imf", "world bank",
  "kebijakan", "regulasi", "omnibus", "ojk", "lps",
  "indikator", "makro", "mikro", "analisis", "prediksi", "forecast",
  "cabai", "beras", "pangan", "bbm", "energi", "listrik",
  "trade war", "geopolitik", "sanksi",
  "dividen", "capital gain", "portofolio",
  "tabungan", "konsumsi", "belanja", "daya beli",
  "produksi", "manufaktur", "industri", "pmi",
  "current account", "capital account", "bop",
  "rating", "outlook", "sovereign",
  "macromic", "dashboard", "data",
];

function isEconomicsRelated(question: string): boolean {
  const lower = question.toLowerCase();
  // Short greetings are OK
  if (lower.length < 15 && /^(hi|halo|hai|hey|hello|selamat|terima kasih|thanks)/.test(lower)) return true;
  return ECONOMICS_KEYWORDS.some((kw) => lower.includes(kw));
}

const OFF_TOPIC_RESPONSE =
  "Maaf, saya adalah asisten analisis ekonomi Macromic. Saya hanya bisa membantu pertanyaan seputar ekonomi, keuangan, pasar modal, kebijakan moneter/fiskal, dan indikator ekonomi Indonesia & global. Silakan ajukan pertanyaan terkait topik tersebut! 📊";

/* -----------------------------------------------------------------------
 * Enhanced local analyst (no API key needed)
 * --------------------------------------------------------------------- */

// Knowledge base for common economics questions
const ECONOMICS_KB: Array<{ patterns: string[]; answer: string }> = [
  {
    patterns: ["apa itu inflasi", "definisi inflasi", "pengertian inflasi"],
    answer: "Inflasi adalah kenaikan harga barang & jasa secara umum dan terus-menerus dalam periode tertentu. Diukur dengan Indeks Harga Konsumen (IHK). Jenis: demand-pull (permintaan naik), cost-push (biaya produksi naik), dan built-in (ekspektasi). Target BI: 2.5% ± 1%. Inflasi moderat (2-4%) dianggap sehat untuk pertumbuhan ekonomi.",
  },
  {
    patterns: ["apa itu gdp", "apa itu pdb", "definisi gdp", "pengertian pdb"],
    answer: "GDP (Gross Domestic Product) / PDB adalah total nilai barang & jasa yang diproduksi dalam suatu negara selama periode tertentu. Komponen: C (konsumsi) + I (investasi) + G (belanja pemerintah) + (X-M) (net ekspor). GDP Indonesia ~$1.3 triliun (2024), terbesar di ASEAN. Pertumbuhan 5%+ dianggap kuat untuk emerging market.",
  },
  {
    patterns: ["apa itu bi rate", "suku bunga acuan", "7 day reverse repo"],
    answer: "BI-7 Day Reverse Repo Rate adalah suku bunga acuan Bank Indonesia. Fungsi: mengendalikan inflasi, menjaga stabilitas Rupiah, dan mendorong pertumbuhan. Mekanisme: BI Rate naik → bunga kredit naik → konsumsi turun → inflasi turun. Saat ini BI Rate berada di kisaran 5.75-6.25% (2024-2025).",
  },
  {
    patterns: ["apa itu resesi", "definisi resesi", "kapan resesi"],
    answer: "Resesi adalah penurunan GDP selama 2 kuartal berturut-turut. Ciri: pengangguran naik, konsumsi turun, investasi lesu, pendapatan pajak turun. Indonesia terakhir resesi di Q2-Q3 2020 (pandemi). Sebelumnya 1998 (krisis Asia). Saat ini Indonesia relatif resilient dengan pertumbuhan 5%+.",
  },
  {
    patterns: ["apa itu tapering", "tapering the fed", "quantitative tightening"],
    answer: "Tapering adalah pengurangan pembelian aset oleh bank sentral (biasanya The Fed). Dampak ke Indonesia: (1) yield US Treasury naik → investor tarik dana dari EM → Rupiah tertekan, (2) likuiditas global berkurang → cost of capital naik, (3) IHSG terkoreksi karena capital outflow. BI biasanya respons dengan menaikkan rate.",
  },
  {
    patterns: ["apa itu current account", "neraca berjalan", "transaksi berjalan"],
    answer: "Current Account (Neraca Transaksi Berjalan) mencatat perdagangan barang/jasa, pendapatan primer (investasi), dan transfer. Defisit = lebih banyak bayar ke luar negeri. Indonesia sering defisit karena impor migas & pembayaran dividen ke investor asing. Defisit >3% GDP dianggap mengkhawatirkan.",
  },
  {
    patterns: ["apa itu ihsg", "indeks harga saham", "bursa efek"],
    answer: "IHSG (Indeks Harga Saham Gabungan) mengukur pergerakan seluruh saham di BEI (Bursa Efek Indonesia). Terdiri dari ~900 emiten. Sektor terbesar: perbankan, komoditas, telekomunikasi. IHSG dipengaruhi oleh: aliran dana asing, harga komoditas, kebijakan BI, dan sentimen global.",
  },
  {
    patterns: ["apa itu obligasi", "surat utang negara", "sbn", "yield obligasi"],
    answer: "Obligasi/SBN (Surat Berharga Negara) adalah surat utang yang diterbitkan pemerintah untuk membiayai APBN. Jenis: SUN (konvensional), SBSN (syariah), ORI (ritel). Yield = imbal hasil. Yield naik = harga turun (investor jual). Yield SBN 10Y Indonesia ~6.5-7% (2024-2025), menarik bagi investor asing.",
  },
  {
    patterns: ["dampak pelemahan rupiah", "rupiah melemah", "depresiasi rupiah"],
    answer: "Dampak Rupiah melemah: (1) Harga impor naik → inflasi imported, (2) Beban utang luar negeri naik, (3) BBM bersubsidi membebani APBN, (4) Eksportir diuntungkan (pendapatan USD lebih tinggi dalam Rp), (5) Investor asing rugi → capital outflow. BI intervensi via cadangan devisa & operasi pasar.",
  },
  {
    patterns: ["apa itu fiskal", "kebijakan fiskal", "apbn"],
    answer: "Kebijakan fiskal = pengaturan pendapatan & belanja negara (APBN). Instrumen: pajak, subsidi, belanja infrastruktur, transfer daerah. APBN 2025: pendapatan ~Rp2.996T, belanja ~Rp3.621T, defisit ~2.5% GDP. Defisit dibatasi UU max 3% GDP. Pembiayaan via penerbitan SBN.",
  },
  {
    patterns: ["apa itu pmi", "purchasing managers index"],
    answer: "PMI (Purchasing Managers' Index) mengukur aktivitas manufaktur. >50 = ekspansi, <50 = kontraksi. Komponen: pesanan baru, produksi, pengiriman, persediaan, tenaga kerja. PMI Indonesia (S&P Global) biasanya 50-54, menunjukkan ekspansi moderat. PMI penting sebagai leading indicator GDP.",
  },
  {
    patterns: ["apa itu gini", "koefisien gini", "ketimpangan"],
    answer: "Koefisien Gini mengukur ketimpangan pendapatan (0 = sempurna merata, 1 = sempurna timpang). Indonesia: ~0.38 (2024), kategori 'ketimpangan sedang'. Tertinggi di Papua & Jakarta. Penyebab: akses pendidikan tidak merata, konsentrasi aset, dan disparitas desa-kota.",
  },
];

function localAnalyse(question: string, ctx: AssistantContext): string {
  const q = question.toLowerCase();

  // Check knowledge base first
  for (const entry of ECONOMICS_KB) {
    if (entry.patterns.some((p) => q.includes(p))) {
      // Enrich with live data if available
      let enrichment = "";
      if (/inflasi/.test(q)) {
        const cpi = ctx.indicators.find((i) => /CPI|INFLASI/i.test(i.code));
        if (cpi) enrichment = `\n\n📊 Data Macromic saat ini: ${cpi.name} = ${cpi.current_value}${cpi.unit === "%" ? "%" : " " + cpi.unit} (${cpi.status}, tren ${cpi.trend}).`;
      }
      if (/kurs|rupiah|usd/.test(q)) {
        const usd = ctx.live.find((l) => l.code === "USD_IDR");
        if (usd) enrichment = `\n\n📊 Data live: USD/IDR = Rp${Math.round(usd.latestValue ?? 0).toLocaleString("id-ID")} (${usd.latestDate}).`;
      }
      if (/gdp|pdb/.test(q)) {
        const gdp = ctx.live.find((l) => l.code === "NY.GDP.MKTP.KD.ZG");
        if (gdp) enrichment = `\n\n📊 Data live: GDP Growth Indonesia = ${gdp.latestValue?.toFixed(2)}% (${gdp.latestDate}).`;
      }
      return entry.answer + enrichment;
    }
  }

  // Dynamic analysis from dashboard data
  if (/inflasi|cpi|harga/.test(q)) {
    const cpi = ctx.indicators.find((i) => /CPI|INFLASI/i.test(i.code));
    if (cpi) {
      return (
        `📊 **${cpi.name}**\nNilai saat ini: ${cpi.current_value}${cpi.unit === "%" ? "%" : " " + cpi.unit}\n` +
        `Tren: ${cpi.trend} | Perubahan: ${cpi.change_pct >= 0 ? "+" : ""}${cpi.change_pct.toFixed(2)}%\n` +
        `Status: ${cpi.status}\n${cpi.description ?? ""}\n\n` +
        `Analisis: ${cpi.status === "GOOD" ? "Inflasi terkendali dalam target BI (2.5% ± 1%)." : cpi.status === "WARNING" ? "Inflasi mendekati batas atas target, perlu diwaspadai." : "Inflasi dalam kondisi normal."}`
      );
    }
  }

  if (/rupiah|kurs|usd|dolar|valas/.test(q)) {
    const usd = ctx.live.find((l) => l.code === "USD_IDR");
    if (usd) {
      const direction = (usd.changePct ?? 0) > 0 ? "melemah" : "menguat";
      return (
        `📊 **Kurs USD/IDR (Live)**\n` +
        `Nilai: Rp${Math.round(usd.latestValue ?? 0).toLocaleString("id-ID")} per 1 USD\n` +
        `Perubahan harian: ${usd.changePct !== null ? (usd.changePct >= 0 ? "+" : "") + usd.changePct.toFixed(3) + "%" : "—"}\n` +
        `Rupiah ${direction} terhadap USD.\n` +
        `Sumber: ${usd.source}\n\n` +
        `Faktor yang mempengaruhi: diferensial suku bunga BI vs Fed, neraca perdagangan, sentimen global, dan aliran modal asing.`
      );
    }
  }

  if (/sebab|kausal|hubungan|pengaruh|dampak/.test(q)) {
    const rels = ctx.relations.slice(0, 5).map(
      (r) => `• ${r.from_code} → ${r.to_code}: kekuatan ${(r.strength * 100).toFixed(0)}%, lag ${r.lag_days} hari\n  ${r.description ?? ""}`,
    );
    return `📊 **Relasi Kausal Terkuat:**\n${rels.join("\n")}\n\nKlik tab "Relasi" untuk penjelasan detail mekanisme transmisi setiap hubungan.`;
  }

  if (/rekomendasi|saran|kebijakan|apa yang harus/.test(q)) {
    const critical = ctx.indicators.filter((i) => i.status === "CRITICAL");
    const warning = ctx.indicators.filter((i) => i.status === "WARNING");
    let rec = "📋 **Rekomendasi berdasarkan kondisi saat ini:**\n\n";
    if (critical.length > 0) {
      rec += `⚠️ Indikator KRITIS: ${critical.map((i) => i.name).join(", ")}\n`;
      rec += `→ Perlu perhatian segera dari pembuat kebijakan.\n\n`;
    }
    if (warning.length > 0) {
      rec += `⚡ Indikator WARNING: ${warning.map((i) => i.name).join(", ")}\n`;
      rec += `→ Monitor ketat, siapkan langkah antisipatif.\n\n`;
    }
    rec += "Rekomendasi umum:\n1. Diversifikasi portofolio investasi\n2. Perhatikan tren suku bunga BI\n3. Monitor kurs USD/IDR untuk keputusan hedging\n4. Pantau harga komoditas untuk sektor riil";
    return rec;
  }

  if (/kondisi|status|ringkasan|overview|bagaimana/.test(q)) {
    const score = (i: Indicator) =>
      (i.status === "CRITICAL" ? 3 : i.status === "WARNING" ? 2 : i.status === "GOOD" ? 1 : 0) +
      Math.min(Math.abs(i.change_pct ?? 0) / 5, 3);
    const ranked = [...ctx.indicators].sort((a, b) => score(b) - score(a));
    const top = ranked.slice(0, 5);

    const lines = top.map(
      (i) => `• ${i.name}: ${i.current_value}${i.unit === "%" ? "%" : " " + i.unit} (${i.status}, ${i.change_pct >= 0 ? "+" : ""}${i.change_pct.toFixed(2)}%)`,
    );

    const usd = ctx.live.find((l) => l.code === "USD_IDR");
    const usdLine = usd ? `\nKurs: Rp${Math.round(usd.latestValue ?? 0).toLocaleString("id-ID")}/USD` : "";

    return (
      `📊 **Ringkasan Ekonomi Indonesia Hari Ini:**\n\n` +
      `${lines.join("\n")}\n${usdLine}\n\n` +
      `Insight teratas: ${ctx.insights[0]?.title ?? "—"}\n\n` +
      `Total ${ctx.indicators.length} indikator dipantau. ${ctx.indicators.filter((i) => i.status === "GOOD").length} GOOD, ` +
      `${ctx.indicators.filter((i) => i.status === "WARNING").length} WARNING, ` +
      `${ctx.indicators.filter((i) => i.status === "CRITICAL").length} CRITICAL.`
    );
  }

  // Greeting
  if (/^(hi|halo|hai|hey|hello|selamat)/.test(q)) {
    return "Halo! 👋 Saya asisten analisis ekonomi Macromic. Saya bisa membantu Anda:\n\n• Menganalisis kondisi ekonomi Indonesia saat ini\n• Menjelaskan konsep ekonomi (inflasi, GDP, kurs, dll)\n• Memberikan insight dari data dashboard\n• Menjawab pertanyaan tentang kebijakan moneter/fiskal\n• Membandingkan data antar negara ASEAN\n\nSilakan tanyakan apa saja seputar ekonomi!";
  }

  // Generic fallback — still try to be helpful
  const liveLine = ctx.live.length
    ? `\n\nData live tersedia: ${ctx.live.slice(0, 3).map((d) => `${d.name} = ${d.latestValue?.toFixed(2) ?? "—"} ${d.unit}`).join("; ")}.`
    : "";

  return (
    `Saya belum memiliki jawaban spesifik untuk pertanyaan ini dalam mode lokal. ` +
    `Untuk analisis yang lebih mendalam dan interaktif, tambahkan API key Gemini (gratis) di pengaturan.` +
    `\n\nNamun, berikut data yang tersedia di dashboard:` +
    `\n• ${ctx.indicators.length} indikator ekonomi (${ctx.indicators.filter((i) => i.status !== "NORMAL").length} perlu perhatian)` +
    `\n• ${ctx.insights.length} AI insights` +
    `\n• ${ctx.relations.length} relasi kausal` +
    liveLine +
    `\n\nCoba tanyakan: "Bagaimana kondisi ekonomi?", "Apa itu inflasi?", atau "Analisis kurs Rupiah".`
  );
}

/* -----------------------------------------------------------------------
 * Gemini call (when key is present) — enhanced with general economics knowledge
 * --------------------------------------------------------------------- */

async function geminiAnalyse(
  question: string,
  ctx: AssistantContext,
  history: ChatMessage[],
  apiKey: string,
): Promise<string> {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemPreamble =
    "Kamu adalah asisten analis ekonomi senior untuk dashboard Macromic Indonesia. " +
    "ATURAN:\n" +
    "1. Jawab HANYA pertanyaan tentang ekonomi, keuangan, pasar modal, kebijakan moneter/fiskal, dan topik terkait.\n" +
    "2. Jika pertanyaan TIDAK berhubungan dengan ekonomi/keuangan, tolak dengan sopan dan arahkan kembali ke topik ekonomi.\n" +
    "3. Gunakan data dari KONTEKS DATA yang diberikan jika relevan.\n" +
    "4. Jawab dalam Bahasa Indonesia yang jelas dan informatif.\n" +
    "5. Berikan analisis mendalam — jelaskan mekanisme, sebab-akibat, dan implikasi.\n" +
    "6. Boleh menjawab pertanyaan ekonomi UMUM (teori, konsep, berita global) meskipun tidak ada di data dashboard.\n" +
    "7. Gunakan emoji untuk readability (📊 untuk data, ⚠️ untuk warning, 💡 untuk insight).\n" +
    "8. Jika diminta prediksi, berikan analisis berbasis data + disclaimer bahwa ini bukan financial advice.";

  const dataContext = JSON.stringify(
    {
      indicators: ctx.indicators.map((i) => ({
        code: i.code, name: i.name, value: i.current_value, unit: i.unit,
        change_pct: i.change_pct, status: i.status, trend: i.trend,
      })),
      live: ctx.live.map((l) => ({
        code: l.code, name: l.name, latest: l.latestValue,
        date: l.latestDate, source: l.source, changePct: l.changePct,
      })),
      relations: ctx.relations.map((r) => ({
        from: r.from_code, to: r.to_code, strength: r.strength, lag_days: r.lag_days, desc: r.description,
      })),
      insights: ctx.insights.map((i) => ({ title: i.title, text: i.insight_text, severity: i.severity })),
    },
    null,
    0,
  );

  const contents = [
    { role: "user",  parts: [{ text: `${systemPreamble}\n\nKONTEKS DATA DASHBOARD:\n${dataContext}` }] },
    { role: "model", parts: [{ text: "Siap. Saya akan menjawab pertanyaan ekonomi berdasarkan data dashboard dan pengetahuan ekonomi umum. Pertanyaan di luar topik ekonomi akan saya tolak dengan sopan." }] },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: question }] },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.5, maxOutputTokens: 1000 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n");
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

/**
 * Public entry point used by the UI. Always resolves to a string answer.
 */
export async function askAssistant(
  question: string,
  ctx: AssistantContext,
  history: ChatMessage[] = [],
): Promise<{ answer: string; mode: "gemini" | "local" }> {
  // Topic guard (applies to both modes)
  if (!isEconomicsRelated(question)) {
    return { answer: OFF_TOPIC_RESPONSE, mode: "local" };
  }

  const key = getStoredApiKey();
  if (!key) {
    return { answer: localAnalyse(question, ctx), mode: "local" };
  }
  try {
    const answer = await geminiAnalyse(question, ctx, history, key);
    return { answer, mode: "gemini" };
  } catch (err) {
    return {
      answer:
        `⚠️ Gagal memanggil Gemini: ${(err as Error).message}\n\nBeralih ke analisis lokal:\n\n` +
        localAnalyse(question, ctx),
      mode: "local",
    };
  }
}
