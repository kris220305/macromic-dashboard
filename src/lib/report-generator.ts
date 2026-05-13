// Narrative Report Generator — generates a 1-page text report
// summarizing the current economic state. Can be copied or printed as PDF.

import type { Indicator, Insight, CausalRelation } from "@/lib/dashboard";
import type { LiveIndicator } from "@/lib/live-data";
import { getStoredApiKey } from "@/lib/ai-assistant";

export type ReportData = {
  indicators: Indicator[];
  insights: Insight[];
  relations: CausalRelation[];
  live: LiveIndicator[];
};

function localReport(data: ReportData): string {
  const date = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const critical = data.indicators.filter((i) => i.status === "CRITICAL");
  const warning = data.indicators.filter((i) => i.status === "WARNING");
  const good = data.indicators.filter((i) => i.status === "GOOD");

  const usdIdr = data.live.find((l) => l.code === "USD_IDR");

  let report = `# Laporan Ekonomi Indonesia — Macromic\n`;
  report += `Tanggal: ${date}\n\n`;
  report += `## Ringkasan Eksekutif\n\n`;
  report += `Dashboard memantau ${data.indicators.length} indikator ekonomi. `;
  report += `Status: ${good.length} GOOD, ${warning.length} WARNING, ${critical.length} CRITICAL.\n\n`;

  if (usdIdr) {
    report += `Kurs USD/IDR: Rp${Math.round(usdIdr.latestValue ?? 0).toLocaleString("id-ID")} `;
    report += `(${usdIdr.changePct !== null ? (usdIdr.changePct >= 0 ? "+" : "") + usdIdr.changePct.toFixed(2) + "%" : "—"}).\n\n`;
  }

  report += `## Indikator Kritis\n\n`;
  if (critical.length === 0) {
    report += `Tidak ada indikator dalam status CRITICAL saat ini.\n\n`;
  } else {
    for (const ind of critical) {
      report += `- **${ind.name}** (${ind.code}): ${ind.current_value} ${ind.unit} — perubahan ${ind.change_pct.toFixed(2)}%\n`;
    }
    report += `\n`;
  }

  report += `## Peringatan\n\n`;
  if (warning.length === 0) {
    report += `Tidak ada indikator dalam status WARNING.\n\n`;
  } else {
    for (const ind of warning) {
      report += `- **${ind.name}**: ${ind.current_value} ${ind.unit} (${ind.change_pct.toFixed(2)}%)\n`;
    }
    report += `\n`;
  }

  report += `## AI Insights Teratas\n\n`;
  for (const insight of data.insights.slice(0, 3)) {
    report += `- [${insight.severity}] **${insight.title}**: ${insight.insight_text.slice(0, 150)}…\n`;
  }
  report += `\n`;

  report += `## Relasi Kausal Terkuat\n\n`;
  for (const rel of data.relations.slice(0, 5)) {
    report += `- ${rel.from_code} → ${rel.to_code}: kekuatan ${(rel.strength * 100).toFixed(0)}%, lag ${rel.lag_days} hari\n`;
  }
  report += `\n`;

  report += `---\n`;
  report += `Sumber: BPS, Bank Indonesia, IDX, World Bank, Open ER API.\n`;
  report += `Dihasilkan oleh Macromic AI Dashboard.\n`;

  return report;
}

async function geminiReport(data: ReportData, apiKey: string): Promise<string> {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const context = JSON.stringify({
    indicators: data.indicators.map((i) => ({
      code: i.code, name: i.name, value: i.current_value, unit: i.unit,
      change_pct: i.change_pct, status: i.status, trend: i.trend,
    })),
    live: data.live.map((l) => ({
      code: l.code, name: l.name, latest: l.latestValue, changePct: l.changePct,
    })),
    insights: data.insights.slice(0, 5).map((i) => ({ title: i.title, text: i.insight_text, severity: i.severity })),
    relations: data.relations.slice(0, 5).map((r) => ({
      from: r.from_code, to: r.to_code, strength: r.strength,
    })),
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text:
          `Kamu adalah analis ekonomi senior. Buat laporan ringkasan ekonomi Indonesia 1 halaman dalam Bahasa Indonesia berdasarkan data berikut. Format markdown. Sertakan: ringkasan eksekutif, indikator kritis, tren utama, rekomendasi kebijakan singkat.\n\nDATA:\n${context}`
        }],
      }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json() as any;
  return json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ?? localReport(data);
}

export async function generateReport(data: ReportData): Promise<{ report: string; mode: "gemini" | "local" }> {
  const key = getStoredApiKey();
  if (!key) return { report: localReport(data), mode: "local" };
  try {
    const report = await geminiReport(data, key);
    return { report, mode: "gemini" };
  } catch {
    return { report: localReport(data), mode: "local" };
  }
}
