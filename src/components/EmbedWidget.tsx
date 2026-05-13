import { useState } from "react";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { generateEmbedCode } from "@/lib/embed-widget";
import type { Indicator } from "@/lib/dashboard";

export function EmbedWidget({ indicator }: { indicator: Indicator }) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = generateEmbedCode(indicator.code);

  function handleCopy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowEmbed((s) => !s)}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition"
      >
        <Code className="h-3 w-3" />
        {showEmbed ? "Tutup embed" : "Embed widget"}
      </button>

      {showEmbed && (
        <div className="mt-2 rounded-xl border bg-background p-3 space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Salin kode di bawah untuk embed kartu indikator ini di website/blog Anda:
          </p>
          <div className="relative">
            <pre className="text-[10px] font-mono bg-muted p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-1 right-1 p-1 rounded bg-card border hover:bg-accent"
              title="Copy"
            >
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
