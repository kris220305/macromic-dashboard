import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, Activity,
  BarChart3, Network, Beaker, GraduationCap, ArrowRight, Loader2, RefreshCw,
  Radio, Bot, Globe, Newspaper, FileText, Code, Star, Landmark,
} from "lucide-react";
import { MacromicLogo } from "@/components/MacromicLogo";
import { LivePanel } from "@/components/LivePanel";
import { AiAssistantPanel } from "@/components/AiAssistantPanel";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { AnomalyAlertPanel } from "@/components/AnomalyAlertPanel";
import { WatchlistWidget, WatchlistToggle } from "@/components/WatchlistWidget";
import { ReportPanel } from "@/components/ReportPanel";
import { MultiCountryPanel } from "@/components/MultiCountryPanel";
import { NewsSentimentPanel } from "@/components/NewsSentimentPanel";
import { QuizPanel } from "@/components/QuizPanel";
import { EmbedWidget } from "@/components/EmbedWidget";
import { VoiceQuery } from "@/components/VoiceQuery";
import { PolicyImpactPanel } from "@/components/PolicyImpactPanel";
import {
  fetchIndicators, fetchIndicatorSeries, fetchInsights, fetchCausalRelations,
  formatValue, type Indicator,
} from "@/lib/dashboard";

export const Route = createFileRoute("/")({ component: Index });

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setTimeout(onDone, 300); return 100; }
        return p + 4;
      });
    }, 70);
    return () => clearInterval(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-hero text-white">
      <div className="animate-in fade-in zoom-in duration-700 flex flex-col items-center gap-6">
        <div className="relative">
          <MacromicLogo size={96} white />
          <div className="absolute inset-0 rounded-2xl animate-ping bg-white/20" style={{ animationDuration: "2s" }} />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight">Macromic</h1>
          <p className="mt-2 text-white/80 text-sm tracking-wide">
            AI-Driven Indonesian Economic Dashboard
          </p>
        </div>
        <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-white/60">Memuat data ekonomi makro & mikro…</p>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  GOOD: "bg-success/10 text-success border-success/20",
  NORMAL: "bg-muted text-muted-foreground border-border",
  WARNING: "bg-warning/10 text-warning border-warning/20",
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/20",
};

function TrendIcon({ trend, change }: { trend: string; change: number }) {
  const Icon = trend === "UP" ? TrendingUp : trend === "DOWN" ? TrendingDown : Minus;
  const positive = change > 0;
  const color =
    trend === "STABLE" ? "text-muted-foreground"
      : positive ? "text-success" : "text-destructive";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {change > 0 ? "+" : ""}{change.toFixed(2)}%
    </span>
  );
}

function KpiCard({ ind, onClick, active }: { ind: Indicator; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border bg-card p-5 transition-all hover:shadow-glow hover:-translate-y-0.5 ${
        active ? "ring-2 ring-primary shadow-glow" : "shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{ind.subcategory}</p>
          <h3 className="text-sm font-semibold text-foreground mt-0.5">{ind.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <WatchlistToggle indicator={ind} />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[ind.status]}`}>
            {ind.status}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {formatValue(ind.current_value, ind.unit)}
          </p>
          <p className="text-[10px] text-muted-foreground">{ind.unit}</p>
        </div>
        <TrendIcon trend={ind.trend} change={ind.change_pct} />
      </div>
    </button>
  );
}

function IndicatorChart({ indicator }: { indicator: Indicator }) {
  const { data, isLoading } = useQuery({
    queryKey: ["series", indicator.id],
    queryFn: () => fetchIndicatorSeries(indicator.id),
  });
  if (isLoading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  const chartData = (data ?? []).map((p) => ({
    month: new Date(p.date).toLocaleDateString("id-ID", { month: "short" }),
    value: Number(p.value),
  }));
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{indicator.name}</h3>
          <p className="text-xs text-muted-foreground">
            Sumber: {indicator.data_source} · 12 bulan terakhir
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{formatValue(indicator.current_value, indicator.unit)}</p>
          <TrendIcon trend={indicator.trend} change={indicator.change_pct} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#g1)" />
        </AreaChart>
      </ResponsiveContainer>
      {indicator.description && (
        <p className="mt-3 text-xs text-muted-foreground">{indicator.description}</p>
      )}
      <EmbedWidget indicator={indicator} />
    </div>
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  HIGH: "border-l-destructive bg-destructive/5",
  MEDIUM: "border-l-warning bg-warning/5",
  LOW: "border-l-primary bg-primary/5",
  INFO: "border-l-primary bg-primary/5",
};

function InsightsList() {
  const { data, isLoading } = useQuery({ queryKey: ["insights"], queryFn: fetchInsights });
  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
  return (
    <div className="space-y-3">
      {(data ?? []).map((i) => (
        <div key={i.id} className={`rounded-xl border border-l-4 bg-card p-4 shadow-card ${SEVERITY_STYLES[i.severity] ?? ""}`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{i.title}</h4>
            </div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              {i.insight_type} · {Math.round(i.confidence_level * 100)}%
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{i.insight_text}</p>
          {i.related_indicator_codes?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {i.related_indicator_codes.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{c}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Detailed causal explanations for each relationship type
const CAUSAL_EXPLANATIONS: Record<string, { mechanism: string; realWorld: string; policy: string }> = {
  "BI_RATE→INFLASI": {
    mechanism: "Kenaikan BI Rate meningkatkan suku bunga deposito & kredit → masyarakat lebih memilih menabung → konsumsi turun → permintaan agregat menurun → tekanan harga berkurang → inflasi turun.",
    realWorld: "Contoh: Saat BI menaikkan rate dari 5.75% ke 6% di Q3 2023, inflasi turun dari 3.5% ke 2.6% dalam 3-6 bulan berikutnya.",
    policy: "Ini adalah mekanisme utama kebijakan moneter (inflation targeting). BI menggunakan 7-Day Reverse Repo Rate sebagai instrumen utama.",
  },
  "BI_RATE→KURS_USD": {
    mechanism: "BI Rate naik → yield aset Rupiah lebih menarik → capital inflow (investor asing masuk) → permintaan Rupiah naik → Rupiah menguat terhadap USD.",
    realWorld: "Diferensial suku bunga BI vs Fed Funds Rate menentukan arah aliran modal. Saat spread menyempit, Rupiah cenderung tertekan.",
    policy: "BI sering menaikkan rate untuk 'menjaga stabilitas Rupiah' terutama saat The Fed hawkish.",
  },
  "INFLASI→KONSUMSI": {
    mechanism: "Inflasi tinggi → daya beli riil masyarakat turun → konsumsi rumah tangga (60% GDP) melambat → pertumbuhan ekonomi tertekan.",
    realWorld: "Inflasi pangan (volatile food) paling dirasakan masyarakat bawah karena proporsi pengeluaran makanan mereka lebih besar (>40% income).",
    policy: "Pemerintah menggunakan subsidi, operasi pasar, dan impor untuk menstabilkan harga pangan.",
  },
  "KURS_USD→INFLASI": {
    mechanism: "Rupiah melemah → harga barang impor naik (imported inflation) → biaya produksi naik (cost-push) → harga jual naik → inflasi meningkat.",
    realWorld: "Indonesia mengimpor ~$200M BBM/hari. Setiap pelemahan 1% Rupiah menambah tekanan inflasi ~0.1-0.2% dalam 3 bulan.",
    policy: "Pass-through rate kurs ke inflasi di Indonesia sekitar 10-20% (moderate), lebih rendah dari negara EM lain.",
  },
  "GDP→UNEMPLOYMENT": {
    mechanism: "GDP tumbuh → perusahaan ekspansi & investasi → permintaan tenaga kerja naik → pengangguran turun (Okun's Law).",
    realWorld: "Di Indonesia, setiap 1% pertumbuhan GDP di atas 5% menurunkan pengangguran ~0.3-0.5 poin persentase.",
    policy: "Target pertumbuhan 5%+ diperlukan untuk menyerap ~2.5 juta angkatan kerja baru per tahun.",
  },
  "FDI→GDP": {
    mechanism: "FDI masuk → investasi langsung di sektor riil → penciptaan lapangan kerja → transfer teknologi → produktivitas naik → GDP tumbuh.",
    realWorld: "FDI ke Indonesia ~$47B (2024), mayoritas ke sektor manufaktur, pertambangan, dan digital economy.",
    policy: "Omnibus Law (UU Cipta Kerja) dirancang untuk menarik FDI dengan menyederhanakan perizinan.",
  },
  "EKSPOR→KURS_USD": {
    mechanism: "Ekspor naik → penerimaan devisa (USD) meningkat → supply USD di pasar domestik naik → Rupiah menguat.",
    realWorld: "Boom komoditas (CPO, batu bara, nikel) 2021-2022 membuat Rupiah relatif stabil meski global volatile.",
    policy: "Kebijakan DHE (Devisa Hasil Ekspor) mewajibkan eksportir menyimpan devisa di bank domestik minimal 3 bulan.",
  },
  "DEFAULT": {
    mechanism: "Hubungan kausal ini menunjukkan bagaimana perubahan pada satu indikator ekonomi mempengaruhi indikator lainnya melalui mekanisme transmisi ekonomi.",
    realWorld: "Dampak biasanya tidak instan — ada time lag (jeda waktu) antara perubahan penyebab dan efek yang terlihat di data.",
    policy: "Pembuat kebijakan harus mempertimbangkan lag effect ini saat merancang intervensi.",
  },
};

function getExplanation(fromCode: string, toCode: string) {
  const key = `${fromCode}→${toCode}`;
  return CAUSAL_EXPLANATIONS[key] ?? CAUSAL_EXPLANATIONS["DEFAULT"];
}

function CausalNetwork() {
  const { data: rels } = useQuery({ queryKey: ["causal"], queryFn: fetchCausalRelations });
  const { data: indicators = [] } = useQuery({ queryKey: ["indicators"], queryFn: fetchIndicators });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Hubungan Kausal Antar Indikator</h3>
          </div>
          <span className="text-xs text-muted-foreground">{(rels ?? []).length} relasi</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Klik pada setiap relasi untuk melihat penjelasan mekanisme, contoh dunia nyata, dan implikasi kebijakan.
        </p>

        <div className="space-y-2">
          {(rels ?? []).map((r) => {
            const isExpanded = expanded === r.id;
            const explanation = getExplanation(r.from_code, r.to_code);
            const fromInd = indicators.find((i) => i.code === r.from_code);
            const toInd = indicators.find((i) => i.code === r.to_code);

            return (
              <div key={r.id} className="rounded-xl border overflow-hidden transition-all">
                <button
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 hover:bg-accent/30 transition ${isExpanded ? "bg-accent/20" : "bg-background/50"}`}
                >
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">{r.from_code}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">{r.to_code}</span>
                  <div className="flex-1 text-xs text-muted-foreground truncate">{r.description}</div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-semibold ${r.strength > 0 ? "text-success" : "text-destructive"}`}>
                      {r.strength > 0 ? "+" : ""}{(r.strength * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">lag {r.lag_days}h</div>
                  </div>
                  <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t bg-accent/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Current values */}
                    <div className="grid grid-cols-2 gap-3">
                      {fromInd && (
                        <div className="rounded-lg border bg-background p-2.5">
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">Penyebab</p>
                          <p className="text-sm font-semibold">{fromInd.name}</p>
                          <p className="text-xs">
                            {formatValue(fromInd.current_value, fromInd.unit)} {fromInd.unit}
                            <span className={`ml-1 ${fromInd.change_pct >= 0 ? "text-success" : "text-destructive"}`}>
                              ({fromInd.change_pct >= 0 ? "+" : ""}{fromInd.change_pct.toFixed(2)}%)
                            </span>
                          </p>
                        </div>
                      )}
                      {toInd && (
                        <div className="rounded-lg border bg-background p-2.5">
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">Dampak</p>
                          <p className="text-sm font-semibold">{toInd.name}</p>
                          <p className="text-xs">
                            {formatValue(toInd.current_value, toInd.unit)} {toInd.unit}
                            <span className={`ml-1 ${toInd.change_pct >= 0 ? "text-success" : "text-destructive"}`}>
                              ({toInd.change_pct >= 0 ? "+" : ""}{toInd.change_pct.toFixed(2)}%)
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Detailed explanation */}
                    <div className="space-y-2">
                      <div className="rounded-lg border-l-4 border-l-primary bg-primary/5 p-3">
                        <p className="text-[10px] uppercase font-bold text-primary mb-1">⚙️ Mekanisme Transmisi</p>
                        <p className="text-xs leading-relaxed text-foreground/80">{explanation.mechanism}</p>
                      </div>
                      <div className="rounded-lg border-l-4 border-l-warning bg-warning/5 p-3">
                        <p className="text-[10px] uppercase font-bold text-warning mb-1">📊 Contoh Dunia Nyata</p>
                        <p className="text-xs leading-relaxed text-foreground/80">{explanation.realWorld}</p>
                      </div>
                      <div className="rounded-lg border-l-4 border-l-chart-2 bg-chart-2/5 p-3">
                        <p className="text-[10px] uppercase font-bold text-chart-2 mb-1">🏛️ Implikasi Kebijakan</p>
                        <p className="text-xs leading-relaxed text-foreground/80">{explanation.policy}</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1">
                      <span>Kekuatan: <strong>{(r.strength * 100).toFixed(1)}%</strong></span>
                      <span>Confidence: <strong>{(r.confidence * 100).toFixed(0)}%</strong></span>
                      <span>Time Lag: <strong>{r.lag_days} hari</strong></span>
                      <span>Arah: <strong className={r.strength > 0 ? "text-success" : "text-destructive"}>{r.strength > 0 ? "Positif (searah)" : "Negatif (berlawanan)"}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend / Guide */}
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Cara Membaca</h4>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">Kekuatan (%)</p>
            <p>Seberapa besar perubahan 1% pada penyebab mempengaruhi dampak. +30% artinya kenaikan 1% penyebab → kenaikan 0.3% dampak.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Time Lag (hari)</p>
            <p>Jeda waktu antara perubahan penyebab dan efek terlihat di data. Lag 90 hari = dampak baru terasa setelah ~3 bulan.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Confidence (%)</p>
            <p>Tingkat keyakinan statistik dari hubungan ini berdasarkan data historis. &gt;80% = sangat reliable.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const EDU = [
  { q: "Apa itu Inflasi?", a: "Inflasi adalah kenaikan harga barang & jasa secara umum dari waktu ke waktu. Bila inflasi 3%, artinya barang yang tahun lalu Rp100.000 sekarang jadi Rp103.000." },
  { q: "Mengapa BI Rate penting?", a: "BI Rate adalah suku bunga acuan. Naiknya BI Rate membuat kredit lebih mahal sehingga menahan inflasi, namun juga memperlambat pertumbuhan ekonomi." },
  { q: "Bagaimana Kurs mempengaruhi saya?", a: "Saat Rupiah melemah, harga barang impor naik (gadget, BBM, bahan baku). Eksportir sebaliknya diuntungkan karena pendapatan dolar lebih tinggi." },
  { q: "Apa hubungan GDP & lapangan kerja?", a: "Pertumbuhan GDP yang kuat biasanya menciptakan lapangan kerja baru — perusahaan ekspansi, butuh lebih banyak pekerja." },
];

function Education() {
  return (
    <div className="space-y-3">
      {EDU.map((e, idx) => (
        <details key={idx} className="rounded-xl border bg-card p-4 shadow-card group">
          <summary className="flex items-center justify-between cursor-pointer font-semibold text-sm">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" /> {e.q}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
          </summary>
          <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{e.a}</p>
        </details>
      ))}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "policy", label: "Kebijakan", icon: Landmark },
  { id: "live", label: "Data Live", icon: Radio },
  { id: "ai", label: "AI Asisten", icon: Bot },
  { id: "macro", label: "Makro", icon: BarChart3 },
  { id: "micro", label: "Mikro", icon: BarChart3 },
  { id: "compare", label: "ASEAN", icon: Globe },
  { id: "sentiment", label: "Sentimen", icon: Newspaper },
  { id: "relations", label: "Relasi", icon: Network },
  { id: "simulation", label: "Simulasi", icon: Beaker },
  { id: "report", label: "Laporan", icon: FileText },
  { id: "education", label: "Edukasi", icon: GraduationCap },
] as const;

export { Index as IndexPage };

function Index() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("overview");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: indicators = [], isLoading } = useQuery({
    queryKey: ["indicators"],
    queryFn: fetchIndicators,
  });

  const macro = indicators.filter((i) => i.category === "MACRO");
  const micro = indicators.filter((i) => i.category === "MICRO");
  const selectedInd = indicators.find((i) => i.id === selected) ?? indicators[0];

  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MacromicLogo size={40} />
            <div>
              <h1 className="font-bold text-lg leading-none">Macromic</h1>
              <p className="text-[11px] text-muted-foreground">Dashboard Ekonomi Indonesia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Live · {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <button className="p-2 rounded-lg hover:bg-accent transition" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
        ) : (
          <>
            {tab === "overview" && (
              <>
                <section className="rounded-3xl bg-gradient-hero text-white p-6 sm:p-8 shadow-glow overflow-hidden relative">
                  <div className="absolute -right-8 -bottom-8 opacity-10">
                    <Activity className="h-48 w-48" />
                  </div>
                  <div className="relative">
                    <p className="text-xs uppercase tracking-widest text-white/70">Status Ekonomi Hari Ini</p>
                    <h2 className="text-3xl sm:text-4xl font-bold mt-2">Stabil dengan Tekanan Pangan</h2>
                    <p className="mt-3 max-w-2xl text-white/80 text-sm leading-relaxed">
                      Inflasi terkendali di koridor BI, namun harga cabai melonjak akibat distribusi musim hujan.
                      Rupiah dalam tren pelemahan ringan terhadap USD.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur">14 Indikator Aktif</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur">5 AI Insights</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur">10 Relasi Kausal</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => setTab("policy")}
                        className="inline-flex items-center gap-2 rounded-xl bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
                      >
                        <Landmark className="h-4 w-4" /> Dampak Kebijakan
                      </button>
                      <button
                        onClick={() => setTab("ai")}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur text-white px-4 py-2 text-sm font-semibold hover:bg-white/25 transition"
                      >
                        <Bot className="h-4 w-4" /> Tanya AI Asisten
                      </button>
                      <button
                        onClick={() => setTab("live")}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur text-white px-4 py-2 text-sm font-semibold hover:bg-white/25 transition"
                      >
                        <Radio className="h-4 w-4" /> Lihat Data Live
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Indikator Utama</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {indicators.slice(0, 8).map((ind) => (
                      <KpiCard key={ind.id} ind={ind} active={selectedInd?.id === ind.id} onClick={() => setSelected(ind.id)} />
                    ))}
                  </div>
                </section>

                <section className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    {selectedInd && <IndicatorChart indicator={selectedInd} />}
                  </div>
                  <div className="space-y-4">
                    <AnomalyAlertPanel />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">AI Insights</h3>
                      </div>
                      <InsightsList />
                    </div>
                  </div>
                </section>
              </>
            )}

            {tab === "macro" && (
              <>
                <h2 className="text-2xl font-bold">Indikator Makroekonomi</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {macro.map((i) => <KpiCard key={i.id} ind={i} active={selectedInd?.id === i.id} onClick={() => setSelected(i.id)} />)}
                </div>
                {selectedInd && selectedInd.category === "MACRO" && <IndicatorChart indicator={selectedInd} />}
              </>
            )}

            {tab === "micro" && (
              <>
                <h2 className="text-2xl font-bold">Indikator Mikroekonomi</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {micro.map((i) => <KpiCard key={i.id} ind={i} active={selectedInd?.id === i.id} onClick={() => setSelected(i.id)} />)}
                </div>
                {selectedInd && selectedInd.category === "MICRO" && <IndicatorChart indicator={selectedInd} />}
              </>
            )}

            {tab === "policy" && <PolicyImpactPanel />}

            {tab === "live" && <LivePanel />}

            {tab === "ai" && <AiAssistantPanel />}

            {tab === "compare" && <MultiCountryPanel />}

            {tab === "sentiment" && <NewsSentimentPanel />}

            {tab === "relations" && <CausalNetwork />}

            {tab === "simulation" && <ScenarioComparison />}

            {tab === "report" && <ReportPanel />}

            {tab === "education" && (
              <>
                <h2 className="text-2xl font-bold">Edukasi & Quiz Ekonomi</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Pahami konsep ekonomi penting dan uji pemahaman Anda dengan quiz interaktif.
                </p>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Materi</h3>
                    <Education />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Quiz Interaktif</h3>
                    <QuizPanel />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground">
          <p>Sumber data: BPS · Bank Indonesia · IDX · Kementerian terkait · World Bank · Open ER API</p>
          <p className="mt-1">© {new Date().getFullYear()} Macromic — AI-Driven Economic Intelligence</p>
        </footer>
      </main>

      {/* Floating Watchlist Widget */}
      <WatchlistWidget />
    </div>
  );
}
