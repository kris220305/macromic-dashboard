import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Copy, Printer, Check } from "lucide-react";
import { fetchIndicators, fetchInsights, fetchCausalRelations } from "@/lib/dashboard";
import { fetchLiveBundle } from "@/lib/live-data";
import { generateReport } from "@/lib/report-generator";

export function ReportPanel() {
  const [report, setReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<"gemini" | "local">("local");
  const [copied, setCopied] = useState(false);

  const { data: indicators = [] } = useQuery({ queryKey: ["indicators"], queryFn: fetchIndicators });
  const { data: insights = [] } = useQuery({ queryKey: ["insights"], queryFn: fetchInsights });
  const { data: relations = [] } = useQuery({ queryKey: ["causal"], queryFn: fetchCausalRelations });
  const { data: liveBundle } = useQuery({ queryKey: ["live-bundle"], queryFn: fetchLiveBundle });

  const liveData = (liveBundle ?? []).filter((e) => e.ok).map((e) => (e as any).data);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { report: r, mode: m } = await generateReport({
        indicators, insights, relations, live: liveData,
      });
      setReport(r);
      setMode(m);
    } catch (err) {
      setReport(`Error: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    if (!report) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Laporan Macromic</title>
      <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}
      h1,h2,h3{color:#1a5c2e}pre{white-space:pre-wrap}</style></head>
      <body><pre>${report}</pre></body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Laporan Naratif</h3>
        </div>
        <div className="flex gap-2">
          {report && (
            <>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-accent transition"
              >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                {copied ? "Tersalin" : "Copy"}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs hover:bg-accent transition"
              >
                <Printer className="h-3 w-3" /> Print/PDF
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {report ? "Regenerate" : "Generate Laporan"}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Generate laporan ringkasan ekonomi 1 halaman. Mode: {mode === "gemini" ? "Gemini AI" : "Lokal (template)"}.
        Bisa di-copy atau print sebagai PDF.
      </p>

      {report && (
        <div className="rounded-xl border bg-background p-4 max-h-[500px] overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{report}</pre>
        </div>
      )}
    </div>
  );
}
