import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Globe, Loader2, RefreshCw } from "lucide-react";
import {
  fetchMultiCountryData, ASEAN_COUNTRIES, COMPARE_INDICATORS,
  type CompareIndicatorCode,
} from "@/lib/multi-country";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function MultiCountryPanel() {
  const [selectedIndicator, setSelectedIndicator] = useState<CompareIndicatorCode>("NY.GDP.MKTP.KD.ZG");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["multi-country", selectedIndicator],
    queryFn: () => fetchMultiCountryData(selectedIndicator),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Transform data for recharts: array of { year, IDN, MYS, THA, VNM, PHL, SGP }
  const chartData = (() => {
    if (!data || data.length === 0) return [];
    // Collect all unique years
    const allYears = new Set<string>();
    for (const country of data) {
      for (const v of country.values) {
        allYears.add(v.year);
      }
    }
    // Build rows
    const rows: Array<Record<string, string | number | undefined>> = [];
    for (const year of [...allYears].sort()) {
      const row: Record<string, string | number | undefined> = { year };
      for (const country of data) {
        const point = country.values.find((v) => v.year === year);
        if (point?.value !== null && point?.value !== undefined) {
          row[country.countryCode] = point.value;
        }
      }
      // Only include if at least one country has data
      if (Object.keys(row).length > 1) {
        rows.push(row);
      }
    }
    return rows;
  })();

  const meta = COMPARE_INDICATORS.find((i) => i.code === selectedIndicator)!;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Perbandingan ASEAN</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(e.target.value as CompareIndicatorCode)}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            {COMPARE_INDICATORS.map((i) => (
              <option key={i.code} value={i.code}>{i.name}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border hover:bg-accent transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Bandingkan <strong>{meta.name}</strong> Indonesia vs negara ASEAN lainnya. Sumber: World Bank Open Data API.
      </p>

      {/* Country legend */}
      <div className="flex flex-wrap gap-3">
        {ASEAN_COUNTRIES.map((c, idx) => (
          <span key={c.code} className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[idx] }}
            />
            {c.flag} {c.name}
            {c.code === "IDN" && <span className="text-[10px] text-primary font-bold">(utama)</span>}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-destructive mb-2">
            Gagal memuat data: {(error as Error).message}
          </p>
          <button onClick={() => refetch()} className="text-xs text-primary hover:underline">
            Coba lagi
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Tidak ada data tersedia untuk indikator ini.
        </p>
      ) : (
        <div className="rounded-xl border bg-background p-4">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="year"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v.toFixed(1)}${meta.unit === "%" ? "%" : ""}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string) => {
                  const country = ASEAN_COUNTRIES.find((c) => c.code === name);
                  const label = country ? `${country.flag} ${country.name}` : name;
                  return [`${value.toFixed(2)}${meta.unit === "%" ? "%" : ""}`, label];
                }}
                labelFormatter={(label) => `Tahun ${label}`}
              />
              {ASEAN_COUNTRIES.map((c, idx) => (
                <Line
                  key={c.code}
                  type="monotone"
                  dataKey={c.code}
                  name={c.code}
                  stroke={COLORS[idx]}
                  strokeWidth={c.code === "IDN" ? 3.5 : 2}
                  dot={{ r: c.code === "IDN" ? 4 : 2, fill: COLORS[idx] }}
                  connectNulls
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest values table */}
      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-2 px-3 text-left font-semibold text-muted-foreground">Negara</th>
                <th className="py-2 px-3 text-right font-semibold text-muted-foreground">Nilai Terakhir</th>
                <th className="py-2 px-3 text-right font-semibold text-muted-foreground">Tahun</th>
                <th className="py-2 px-3 text-right font-semibold text-muted-foreground">Ranking</th>
              </tr>
            </thead>
            <tbody>
              {[...data]
                .map((cd) => {
                  const latest = [...cd.values].reverse().find((v) => v.value !== null);
                  return { ...cd, latestValue: latest?.value ?? null, latestYear: latest?.year ?? null };
                })
                .sort((a, b) => (b.latestValue ?? -Infinity) - (a.latestValue ?? -Infinity))
                .map((cd, rank) => {
                  const idx = ASEAN_COUNTRIES.findIndex((c) => c.code === cd.countryCode);
                  const flag = ASEAN_COUNTRIES[idx]?.flag ?? "";
                  const isIDN = cd.countryCode === "IDN";
                  return (
                    <tr key={cd.countryCode} className={`border-t hover:bg-accent/30 ${isIDN ? "bg-primary/5 font-semibold" : ""}`}>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] ?? "#888" }} />
                          {flag} {cd.country}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {cd.latestValue !== null ? `${cd.latestValue.toFixed(2)}${meta.unit === "%" ? "%" : ""}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">{cd.latestYear ?? "—"}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rank === 0 ? "bg-success/10 text-success" : ""}`}>
                          #{rank + 1}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
