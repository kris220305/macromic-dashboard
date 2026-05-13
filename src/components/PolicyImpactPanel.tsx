import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  Landmark, Loader2, RefreshCw, ExternalLink, ChevronDown, ChevronUp,
  AlertTriangle, TrendingUp, TrendingDown, Minus, Filter, Clock,
} from "lucide-react";
import {
  fetchPolicyEvents, CATEGORY_INFO,
  type PolicyEvent, type PolicyCategory, type ImpactLevel,
} from "@/lib/policy-impact";

const POLICY_FEEDS_COUNT = 14; // number of RSS sources

const IMPACT_COLORS = {
  HIGH: { bg: "bg-destructive/10", border: "border-l-destructive", text: "text-destructive" },
  MEDIUM: { bg: "bg-warning/10", border: "border-l-warning", text: "text-warning" },
  LOW: { bg: "bg-primary/10", border: "border-l-primary", text: "text-primary" },
};

const DIRECTION_ICONS = {
  POSITIVE: { Icon: TrendingUp, color: "text-success", label: "Positif" },
  NEGATIVE: { Icon: TrendingDown, color: "text-destructive", label: "Negatif" },
  MIXED: { Icon: Minus, color: "text-warning", label: "Campuran" },
};

function ImpactChart({ indicators }: { indicators: PolicyEvent["affectedIndicators"] }) {
  if (indicators.length === 0) return null;
  const data = indicators.map((ind) => ({
    name: ind.code,
    fullName: ind.name,
    impact: ind.impactPct,
    fill: ind.impactPct >= 0 ? "var(--success)" : "var(--destructive)",
  }));

  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Estimasi Dampak ke Indikator</p>
      <ResponsiveContainer width="100%" height={Math.max(120, indicators.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: number, _: string, props: any) => [
              `${value > 0 ? "+" : ""}${value.toFixed(2)}%`,
              props.payload.fullName,
            ]}
          />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PolicyCard({ event }: { event: PolicyEvent }) {
  const [expanded, setExpanded] = useState(false);
  const catInfo = CATEGORY_INFO[event.category];
  const impactStyle = IMPACT_COLORS[event.impactLevel];
  const dirInfo = DIRECTION_ICONS[event.impactDirection];
  const DirIcon = dirInfo.Icon;

  return (
    <div className={`rounded-xl border border-l-4 ${impactStyle.border} ${impactStyle.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-4 hover:bg-accent/20 transition"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 text-lg">{catInfo.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-bold uppercase ${catInfo.color}`}>{catInfo.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${impactStyle.text} ${impactStyle.bg}`}>
                {event.impactLevel}
              </span>
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${dirInfo.color}`}>
                <DirIcon className="h-3 w-3" /> {dirInfo.label}
              </span>
              {event.region !== "Nasional" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                  📍 {event.region}
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold leading-tight line-clamp-2">{event.title}</h4>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(event.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span>{event.source}</span>
              {event.budgetImpact && (
                <span className="font-bold text-foreground">💰 {event.budgetImpact}</span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {event.summary && (
            <p className="text-xs text-foreground/80 leading-relaxed">{event.summary}</p>
          )}

          {/* Impact visualization */}
          <ImpactChart indicators={event.affectedIndicators} />

          {/* Detailed impact table */}
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="py-1.5 px-2 text-left font-semibold">Indikator</th>
                  <th className="py-1.5 px-2 text-right font-semibold">Dampak</th>
                  <th className="py-1.5 px-2 text-left font-semibold">Mekanisme</th>
                  <th className="py-1.5 px-2 text-right font-semibold">Timeframe</th>
                </tr>
              </thead>
              <tbody>
                {event.affectedIndicators.map((ind) => (
                  <tr key={ind.code} className="border-t">
                    <td className="py-1.5 px-2 font-semibold">{ind.name}</td>
                    <td className={`py-1.5 px-2 text-right font-bold ${ind.impactPct >= 0 ? "text-success" : "text-destructive"}`}>
                      {ind.impactPct >= 0 ? "+" : ""}{ind.impactPct.toFixed(2)}%
                    </td>
                    <td className="py-1.5 px-2 text-muted-foreground">{ind.mechanism}</td>
                    <td className="py-1.5 px-2 text-right text-muted-foreground">{ind.timeframe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Source link */}
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Baca selengkapnya di {event.source} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export function PolicyImpactPanel() {
  const [filterCategory, setFilterCategory] = useState<PolicyCategory | "ALL">("ALL");
  const [filterLevel, setFilterLevel] = useState<ImpactLevel | "ALL">("ALL");

  const { data: events = [], isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["policy-events"],
    queryFn: fetchPolicyEvents,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    staleTime: 15 * 60 * 1000,
  });

  const filtered = events.filter((e) => {
    if (filterCategory !== "ALL" && e.category !== filterCategory) return false;
    if (filterLevel !== "ALL" && e.impactLevel !== filterLevel) return false;
    return true;
  });

  // Stats
  const highCount = events.filter((e) => e.impactLevel === "HIGH").length;
  const negCount = events.filter((e) => e.impactDirection === "NEGATIVE").length;
  const categories = [...new Set(events.map((e) => e.category))];

  // Impact summary chart data
  const categorySummary = categories.map((cat) => {
    const catEvents = events.filter((e) => e.category === cat);
    const avgImpact = catEvents.reduce((sum, e) => {
      const maxImpact = Math.max(...e.affectedIndicators.map((i) => Math.abs(i.impactPct)));
      return sum + maxImpact;
    }, 0) / (catEvents.length || 1);
    return {
      category: CATEGORY_INFO[cat]?.emoji + " " + (CATEGORY_INFO[cat]?.label ?? cat),
      count: catEvents.length,
      avgImpact: Number(avgImpact.toFixed(2)),
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Landmark className="h-6 w-6 text-primary" /> Dampak Kebijakan & Peristiwa
          </h2>
          <p className="text-sm text-muted-foreground">
            Tracking real-time kebijakan pemerintah, regulasi, kasus korupsi, dan peristiwa politik-ekonomi
            yang mempengaruhi indikator ekonomi. Update setiap 30 menit dari {POLICY_FEEDS_COUNT} sumber resmi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dataUpdatedAt > 0 && (
            <span className="text-[10px] text-muted-foreground">
              Update: {new Date(dataUpdatedAt).toLocaleTimeString("id-ID")}
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded-xl border bg-card px-3 py-2 text-xs font-medium hover:bg-accent transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{events.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Total Peristiwa</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{highCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Dampak Tinggi</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-warning">{negCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Dampak Negatif</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-primary">{categories.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Kategori Aktif</p>
        </div>
      </div>

      {/* Category distribution chart */}
      {categorySummary.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Distribusi per Kategori</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categorySummary} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="category" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
              />
              <Bar dataKey="count" name="Jumlah" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as PolicyCategory | "ALL")}
          className="rounded-lg border bg-background px-2 py-1 text-xs"
        >
          <option value="ALL">Semua Kategori</option>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <option key={key} value={key}>{info.emoji} {info.label}</option>
          ))}
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as ImpactLevel | "ALL")}
          className="rounded-lg border bg-background px-2 py-1 text-xs"
        >
          <option value="ALL">Semua Level</option>
          <option value="HIGH">🔴 High Impact</option>
          <option value="MEDIUM">🟡 Medium Impact</option>
          <option value="LOW">🟢 Low Impact</option>
        </select>
        <span className="text-[10px] text-muted-foreground">
          Menampilkan {filtered.length} dari {events.length}
        </span>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {events.length === 0
              ? "Tidak dapat memuat berita kebijakan saat ini. RSS feed mungkin tidak tersedia."
              : "Tidak ada peristiwa yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <PolicyCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Methodology note */}
      <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">📋 Metodologi</p>
        <p>• Berita diambil dari {POLICY_FEEDS_COUNT} sumber resmi & kredibel setiap 30 menit</p>
        <p>• Klasifikasi kategori & estimasi dampak menggunakan keyword-based analysis</p>
        <p>• Persentase dampak adalah estimasi berdasarkan studi empiris & model ekonometrik sederhana</p>
        <p>• Untuk analisis lebih akurat, gunakan AI Asisten dengan API key Gemini</p>
      </div>
    </section>
  );
}
