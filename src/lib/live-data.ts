// Real-time / latest economic data fetched directly from PUBLIC sources
// (no API key required) so users can verify the data is genuine.
//
// Sources:
//  - World Bank Open Data API (https://api.worldbank.org/v2)  — official, no key
//  - Open ER API             (https://open.er-api.com/v6)     — daily FX rates, no key
//  - Frankfurter             (https://api.frankfurter.app)    — ECB historical FX, no key
//
// We deliberately avoid endpoints that require API keys so the demo works
// out-of-the-box and the data trail is auditable.

export type LiveSeriesPoint = { date: string; value: number };

export type LiveIndicator = {
  code: string;
  name: string;
  unit: string;
  source: string;
  sourceUrl: string;       // direct link the user can click to verify
  latestValue: number | null;
  latestDate: string | null;
  series: LiveSeriesPoint[];
  changePct: number | null;
};

const WB_BASE = "https://api.worldbank.org/v2";

// World Bank indicator catalogue we expose. Keep small & meaningful.
const WB_INDICATORS = [
  { code: "NY.GDP.MKTP.KD.ZG", name: "GDP Growth (annual %)",                  unit: "%"        },
  { code: "FP.CPI.TOTL.ZG",   name: "Inflation, consumer prices (annual %)",  unit: "%"        },
  { code: "SL.UEM.TOTL.ZS",   name: "Unemployment, total (% of labor force)", unit: "%"        },
  { code: "FR.INR.RINR",      name: "Real interest rate (%)",                  unit: "%"        },
  { code: "NE.EXP.GNFS.CD",   name: "Exports of goods & services (USD)",      unit: "USD"      },
  { code: "NE.IMP.GNFS.CD",   name: "Imports of goods & services (USD)",      unit: "USD"      },
  { code: "BX.KLT.DINV.CD.WD",name: "Foreign direct investment, net inflows", unit: "USD"      },
  { code: "SP.POP.TOTL",      name: "Population, total",                       unit: "people"   },
] as const;

export type WorldBankCode = typeof WB_INDICATORS[number]["code"];

export function listWorldBankIndicators() {
  return WB_INDICATORS.map((i) => ({ ...i }));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Fetch ${url} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Fetch a World Bank indicator for Indonesia (ISO=IDN), last 15 years.
 * Returns the full series + the most recent non-null observation.
 */
export async function fetchWorldBankIndicator(
  code: WorldBankCode,
  country = "IDN",
): Promise<LiveIndicator> {
  const meta = WB_INDICATORS.find((i) => i.code === code)!;
  const url =
    `${WB_BASE}/country/${country}/indicator/${code}` +
    `?format=json&per_page=20&date=${new Date().getFullYear() - 19}:${new Date().getFullYear()}`;
  const sourceUrl = url.replace("&per_page=20", ""); // user-friendly verify link

  const json = (await fetchJson<unknown>(url)) as
    | [unknown, Array<{ date: string; value: number | null }> | null]
    | { message: unknown };

  if (!Array.isArray(json) || !Array.isArray(json[1])) {
    throw new Error(`World Bank returned no data for ${code}`);
  }

  const rows = json[1]
    .filter((r) => r.value !== null)
    .map((r) => ({ date: r.date, value: Number(r.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const latest = rows[rows.length - 1] ?? null;
  const prev = rows[rows.length - 2] ?? null;
  const changePct =
    latest && prev && prev.value !== 0
      ? ((latest.value - prev.value) / Math.abs(prev.value)) * 100
      : null;

  return {
    code,
    name: meta.name,
    unit: meta.unit,
    source: "World Bank Open Data",
    sourceUrl,
    latestValue: latest?.value ?? null,
    latestDate: latest?.date ?? null,
    series: rows,
    changePct,
  };
}

/**
 * Fetch live FX rate IDR per 1 USD from open.er-api.com (updated daily, no key).
 */
export async function fetchLiveUsdIdr(): Promise<LiveIndicator> {
  const url = "https://open.er-api.com/v6/latest/USD";
  const json = await fetchJson<{
    result: string;
    time_last_update_utc: string;
    rates: Record<string, number>;
  }>(url);

  if (json.result !== "success" || !json.rates?.IDR) {
    throw new Error("FX provider returned no IDR rate");
  }

  // Build a 30-day series from Frankfurter (ECB) so user sees motion, not a single point
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const histUrl =
    `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=USD&to=IDR`;
  let series: LiveSeriesPoint[] = [];
  try {
    const hist = await fetchJson<{ rates: Record<string, { IDR: number }> }>(histUrl);
    series = Object.entries(hist.rates ?? {})
      .map(([date, r]) => ({ date, value: r.IDR }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    /* if Frankfurter fails we still return the latest spot value */
  }
  // Append today's spot from Open ER API
  series.push({ date: fmt(end), value: json.rates.IDR });

  const prev = series[series.length - 2];
  const changePct =
    prev && prev.value !== 0
      ? ((json.rates.IDR - prev.value) / prev.value) * 100
      : null;

  return {
    code: "USD_IDR",
    name: "USD → IDR (Spot Rate)",
    unit: "IDR",
    source: "open.er-api.com (daily) + Frankfurter (ECB history)",
    sourceUrl: url,
    latestValue: json.rates.IDR,
    latestDate: json.time_last_update_utc,
    series,
    changePct,
  };
}

/**
 * Convenience: fetch the full live-data bundle in parallel.
 * Each entry can fail independently (network/CORS) — failures are surfaced
 * with `error` so the UI can show a row instead of silently dropping it.
 */
export type LiveBundleEntry =
  | { ok: true;  data: LiveIndicator }
  | { ok: false; code: string; name: string; error: string };

export async function fetchLiveBundle(): Promise<LiveBundleEntry[]> {
  const tasks: Array<{ code: string; name: string; run: () => Promise<LiveIndicator> }> = [
    { code: "USD_IDR", name: "USD → IDR", run: fetchLiveUsdIdr },
    ...WB_INDICATORS.map((i) => ({
      code: i.code,
      name: i.name,
      run: () => fetchWorldBankIndicator(i.code),
    })),
  ];

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  return settled.map((r, idx): LiveBundleEntry =>
    r.status === "fulfilled"
      ? { ok: true, data: r.value }
      : { ok: false, code: tasks[idx].code, name: tasks[idx].name, error: String(r.reason?.message ?? r.reason) },
  );
}

export function formatLive(value: number | null, unit: string): string {
  if (value === null || Number.isNaN(value)) return "—";
  if (unit === "USD") {
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString("en-US")}`;
  }
  if (unit === "IDR") return `Rp${Math.round(value).toLocaleString("id-ID")}`;
  if (unit === "people") return value.toLocaleString("en-US");
  return `${value.toFixed(2)}${unit === "%" ? "%" : ""}`;
}
