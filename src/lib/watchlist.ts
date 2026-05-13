// Personal Watchlist — stored in localStorage, no login required.

const WATCHLIST_KEY = "MACROMIC_WATCHLIST";

export function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToWatchlist(code: string) {
  const list = getWatchlist();
  if (!list.includes(code)) {
    list.push(code);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  }
}

export function removeFromWatchlist(code: string) {
  const list = getWatchlist().filter((c) => c !== code);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}

export function isInWatchlist(code: string): boolean {
  return getWatchlist().includes(code);
}

export function clearWatchlist() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WATCHLIST_KEY);
}
