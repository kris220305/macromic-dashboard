// Anomaly Alert Push — detect when indicators move >2σ from their mean
// and trigger browser notifications (Web Push via Notification API).

import type { Indicator } from "@/lib/dashboard";
import type { LiveIndicator } from "@/lib/live-data";

export type AnomalyEntry = {
  code: string;
  name: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  direction: "above" | "below";
  timestamp: string;
};

/**
 * Compute z-score anomalies from a series of values.
 * Returns entries where |z| > threshold (default 2).
 */
export function detectAnomalies(
  indicators: Indicator[],
  liveData: LiveIndicator[],
  threshold = 2,
): AnomalyEntry[] {
  const anomalies: AnomalyEntry[] = [];

  // Check live data series for anomalies
  for (const live of liveData) {
    if (live.series.length < 5) continue;
    const values = live.series.map((p) => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) continue;

    const latest = values[values.length - 1];
    const zScore = (latest - mean) / stdDev;

    if (Math.abs(zScore) > threshold) {
      anomalies.push({
        code: live.code,
        name: live.name,
        value: latest,
        mean,
        stdDev,
        zScore,
        direction: zScore > 0 ? "above" : "below",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check Supabase indicators by change_pct as proxy
  for (const ind of indicators) {
    if (Math.abs(ind.change_pct) > 10) {
      anomalies.push({
        code: ind.code,
        name: ind.name,
        value: ind.current_value,
        mean: ind.previous_value,
        stdDev: Math.abs(ind.current_value - ind.previous_value) / 2,
        zScore: ind.change_pct / 5,
        direction: ind.change_pct > 0 ? "above" : "below",
        timestamp: ind.last_update,
      });
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

/**
 * Request notification permission and send browser notification.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendAnomalyNotification(anomaly: AnomalyEntry) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(`⚠️ Anomali: ${anomaly.name}`, {
    body: `${anomaly.name} ${anomaly.direction === "above" ? "melonjak" : "anjlok"} (z-score: ${anomaly.zScore.toFixed(2)}). Nilai: ${anomaly.value.toFixed(2)}`,
    icon: "/favicon.ico",
    tag: `anomaly-${anomaly.code}`,
  });
}

// Storage for dismissed alerts
const DISMISSED_KEY = "MACROMIC_DISMISSED_ANOMALIES";

export function getDismissedAnomalies(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function dismissAnomaly(code: string) {
  if (typeof window === "undefined") return;
  const dismissed = getDismissedAnomalies();
  if (!dismissed.includes(code)) {
    dismissed.push(code);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

export function clearDismissedAnomalies() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DISMISSED_KEY);
}
