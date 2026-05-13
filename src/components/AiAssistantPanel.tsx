import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, KeyRound, Loader2, Send, Sparkles, Trash2, User } from "lucide-react";
import {
  askAssistant, getStoredApiKey, setStoredApiKey,
  type ChatMessage,
} from "@/lib/ai-assistant";
import {
  fetchIndicators, fetchInsights, fetchCausalRelations,
} from "@/lib/dashboard";
import { fetchLiveBundle } from "@/lib/live-data";
import { VoiceQuery } from "@/components/VoiceQuery";

const SUGGESTIONS = [
  "Bagaimana kondisi ekonomi Indonesia hari ini?",
  "Apa itu inflasi dan bagaimana dampaknya?",
  "Analisis tren Rupiah terhadap USD",
  "Jelaskan apa itu BI Rate dan fungsinya",
  "Apa dampak tapering The Fed ke Indonesia?",
  "Indikator mana yang paling mengkhawatirkan?",
  "Apa itu current account deficit?",
  "Rekomendasi kebijakan saat ini",
];

export function AiAssistantPanel() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState("");
  const [showKeyForm, setShowKeyForm] = useState(false);

  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mode, setMode] = useState<"gemini" | "local">("local");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKey(getStoredApiKey());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, thinking]);

  const indicatorsQ = useQuery({ queryKey: ["indicators"], queryFn: fetchIndicators });
  const insightsQ   = useQuery({ queryKey: ["insights"],   queryFn: fetchInsights });
  const relationsQ  = useQuery({ queryKey: ["causal"],     queryFn: fetchCausalRelations });
  const liveQ       = useQuery({ queryKey: ["live-bundle"], queryFn: fetchLiveBundle });

  const ctxReady =
    indicatorsQ.data && insightsQ.data && relationsQ.data && liveQ.data;

  async function send(question: string) {
    if (!question.trim() || thinking || !ctxReady) return;
    const next: ChatMessage[] = [...history, { role: "user", content: question }];
    setHistory(next);
    setInput("");
    setThinking(true);
    try {
      const ctx = {
        indicators: indicatorsQ.data!,
        insights: insightsQ.data!,
        relations: relationsQ.data!,
        live: (liveQ.data ?? []).filter((e) => e.ok).map((e) => (e as { data: any }).data),
      };
      const { answer, mode: usedMode } = await askAssistant(question, ctx, history);
      setMode(usedMode);
      setHistory((h) => [...h, { role: "assistant", content: answer }]);
    } catch (err) {
      setHistory((h) => [
        ...h,
        { role: "assistant", content: `(Error: ${(err as Error).message})` },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function saveKey() {
    const trimmed = draftKey.trim();
    setStoredApiKey(trimmed || null);
    setApiKey(trimmed || null);
    setDraftKey("");
    setShowKeyForm(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" /> AI Asisten Macromic
          </h2>
          <p className="text-sm text-muted-foreground">
            Tanyakan apa pun tentang ekonomi — dari data dashboard hingga teori ekonomi umum.
            Asisten akan menjawab selama topiknya berkaitan dengan ekonomi & keuangan.
            {apiKey ? " Mode: Gemini AI (interaktif penuh)." : " Mode: Lokal (knowledge base + data dashboard)."}
          </p>
        </div>
        <button
          onClick={() => setShowKeyForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs font-medium hover:bg-accent transition"
        >
          <KeyRound className="h-4 w-4" />
          {apiKey ? "Ganti API Key" : "Tambah Gemini API Key"}
        </button>
      </div>

      {showKeyForm && (
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <label className="text-xs font-medium text-muted-foreground">
            Google AI Studio (Gemini) API Key — disimpan hanya di browser Anda (localStorage).
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="AIza…"
              className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={saveKey}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Simpan
            </button>
            {apiKey && (
              <button
                onClick={() => {
                  setStoredApiKey(null);
                  setApiKey(null);
                }}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-accent"
                title="Hapus key"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Dapatkan key gratis di{" "}
            <a className="text-primary hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              aistudio.google.com/apikey
            </a>
            . Tanpa key, asisten tetap berjalan dalam mode lokal yang menjawab dari data dashboard.
          </p>
        </div>
      )}

      <div className="rounded-2xl border bg-card shadow-card flex flex-col h-[520px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Bot className="h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground max-w-md">
                Mulai percakapan untuk menganalisis kondisi ekonomi Indonesia.
                Asisten memiliki akses ke seluruh indikator, relasi kausal, dan data live di dashboard.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs rounded-full border bg-background px-3 py-1.5 hover:bg-accent transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/50 text-foreground"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex gap-2 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-accent/50 px-4 py-2.5 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Menganalisis…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t p-3 flex gap-2"
        >
          <VoiceQuery onResult={(text) => send(text)} disabled={!ctxReady || thinking} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ctxReady ? "Tanyakan kondisi ekonomi…" : "Memuat konteks data…"}
            disabled={!ctxReady || thinking}
            className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!ctxReady || thinking || !input.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1"
          >
            <Send className="h-4 w-4" /> Kirim
          </button>
        </form>

        <div className="px-4 py-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
          <span>
            Mode aktif:{" "}
            <span className={`font-bold ${mode === "gemini" ? "text-primary" : "text-foreground"}`}>
              {apiKey ? (mode === "gemini" ? "Gemini" : "Lokal (fallback)") : "Lokal"}
            </span>
          </span>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> Bersihkan
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
