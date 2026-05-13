import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ExternalLink, Loader2, Radio, RefreshCw, ShieldCheck } from "lucide-react";
import { fetchLiveBundle, formatLive, type LiveBundleEntry } from "@/lib/live-data";

function StatusDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
    </span>
  );
}

function MiniSparkline({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) return <div className="h-14" />;
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#liveGrad)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function LiveCard({ entry }: { entry: LiveBundleEntry }) {
  if (!entry.ok) {
    return (
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{entry.code}</p>
        <h4 className="text-sm font-semibold">{entry.name}</h4>
        <p className="mt-2 text-xs text-destructive">Gagal memuat: {entry.error}</p>
      </div>
    );
  }
  const d = entry.data;
  const change = d.changePct;
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono">{d.code}</p>
          <h4 className="text-sm font-semibold leading-tight">{d.name}</h4>
        </div>
        <StatusDot />
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-xl font-bold">{formatLive(d.latestValue, d.unit)}</p>
        {change !== null && (
          <span className={`text-xs font-bold ${change >= 0 ? "text-success" : "text-destructive"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        )}
      </div>
      <MiniSparkline data={d.series.slice(-30)} />
      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span>{d.latestDate ?? "—"}</span>
        <a
          href={d.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          {d.source} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export function LivePanel() {
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["live-bundle"],
    queryFn: fetchLiveBundle,
    refetchInterval: 5 * 60 * 1000,   // refresh every 5 min
    staleTime: 60 * 1000,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Radio className="h-6 w-6 text-primary" /> Data Real-Time
          </h2>
          <p className="text-sm text-muted-foreground">
            Diambil langsung dari sumber resmi publik. Klik tautan di setiap kartu untuk memverifikasi.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium hover:bg-accent transition"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border bg-success/5 border-success/30 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Data terverifikasi & dapat diaudit</p>
          <p className="text-muted-foreground mt-0.5">
            Endpoint yang digunakan: <code className="font-mono text-xs">api.worldbank.org/v2</code>,{" "}
            <code className="font-mono text-xs">open.er-api.com/v6</code>,{" "}
            <code className="font-mono text-xs">api.frankfurter.app</code>. Tidak ada data mock — setiap angka
            di panel ini berasal dari respons HTTP resmi yang dapat Anda buka di tab browser baru.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Gagal memuat bundel data live: {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data ?? []).map((e) => (
            <LiveCard key={e.ok ? e.data.code : e.code} entry={e} />
          ))}
        </div>
      )}
    </section>
  );
}
