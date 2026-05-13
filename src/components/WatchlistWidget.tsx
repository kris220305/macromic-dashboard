import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Star, X } from "lucide-react";
import { fetchIndicators, formatValue, type Indicator } from "@/lib/dashboard";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/watchlist";

export function WatchlistWidget() {
  const [watchCodes, setWatchCodes] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const { data: indicators = [] } = useQuery({ queryKey: ["indicators"], queryFn: fetchIndicators });

  useEffect(() => {
    setWatchCodes(getWatchlist());
  }, []);

  const watched = indicators.filter((i) => watchCodes.includes(i.code));

  function handleRemove(code: string) {
    removeFromWatchlist(code);
    setWatchCodes((c) => c.filter((x) => x !== code));
  }

  if (watchCodes.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72">
      <div className="rounded-2xl border bg-card shadow-glow overflow-hidden">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-primary/5 hover:bg-primary/10 transition"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Star className="h-4 w-4 text-primary" />
            Watchlist ({watched.length})
          </span>
          {collapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        {!collapsed && (
          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
            {watched.map((ind) => (
              <div key={ind.code} className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{ind.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatValue(ind.current_value, ind.unit)}{" "}
                    <span className={ind.change_pct >= 0 ? "text-success" : "text-destructive"}>
                      ({ind.change_pct >= 0 ? "+" : ""}{ind.change_pct.toFixed(2)}%)
                    </span>
                  </p>
                </div>
                <button onClick={() => handleRemove(ind.code)} className="p-1 rounded hover:bg-accent shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WatchlistToggle({ indicator, onToggle }: { indicator: Indicator; onToggle?: () => void }) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setInList(getWatchlist().includes(indicator.code));
  }, [indicator.code]);

  function toggle() {
    if (inList) {
      removeFromWatchlist(indicator.code);
      setInList(false);
    } else {
      addToWatchlist(indicator.code);
      setInList(true);
    }
    onToggle?.();
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      className={`p-1 rounded-lg transition ${inList ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
      title={inList ? "Hapus dari watchlist" : "Tambah ke watchlist"}
    >
      <Star className={`h-3.5 w-3.5 ${inList ? "fill-primary" : ""}`} />
    </button>
  );
}
