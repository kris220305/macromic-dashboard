// Embed Widget — generate iframe/embed code for a single indicator card.

export function generateEmbedCode(indicatorCode: string, baseUrl?: string): string {
  const base = baseUrl ?? window.location.origin;
  const src = `${base}/embed/${indicatorCode}`;
  return `<iframe src="${src}" width="320" height="200" frameborder="0" style="border-radius:16px;border:1px solid #e5e7eb;" title="Macromic - ${indicatorCode}"></iframe>`;
}

export function generateEmbedUrl(indicatorCode: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://macromic.app");
  return `${base}/embed/${indicatorCode}`;
}
