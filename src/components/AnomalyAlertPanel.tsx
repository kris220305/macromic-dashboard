import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, BellOff, X } from "lucide-react";
import { fetchIndicators } from "@/lib/dashboard";
import { fetchLiveBundle } from "@/lib/live-data";
import {
  detectAnomalies, requestNotificationPermission, sendAnomalyNotification,
  getDismissedAnomalies, dismissAnomaly, clearDismissedAnomalies,
  type AnomalyEntry,
} from "@/lib/anomaly-alert";

export function AnomalyAlertPanel() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: indicators = [] } = useQuery({ queryKey: ["indicators"], queryFn: fetchIndicators });
  const { data: liveBundle } = useQuery({ queryKey: ["live-bundle"], queryFn: fetchLiveBundle });

  const liveData = (liveBundle ?? []).filter((e) => e.ok).map((e) => (e as any).data);
  const anomalies = detectAnomalies(indicators, liveData);
  const visible = anomalies.filter((a) => !dismissed.includes(a.code));

  useEffect(() => {
    setDismissed(getDismissedAnomalies());
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (notifEnabled && visible.length > 0) {
      sendAnomalyNotification(visible[0]);
    }
  }, [notifEnabled, visible.length]);

  async function toggleNotif() {
    if (notifEnabled) {
      setNotifEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      setNotifEnabled(granted);
    }
  }

  function handleDismiss(code: string) {
    dismissAnomaly(code);
    setDismissed((d) => [...d, code]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Anomaly Alerts ({visible.length})
        </h3>
        <button
          onClick={toggleNotif}
          className="inline-flex items-center gap-1 text-xs rounded-lg border px-2 py-1 hover:bg-accent transition"
          title={notifEnabled ? "Matikan notifikasi" : "Aktifkan notifikasi browser"}
        >
          {notifEnabled ? <Bell className="h-3 w-3 text-primary" /> : <BellOff className="h-3 w-3" />}
          {notifEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Tidak ada anomali terdeteksi saat ini. Semua indikator dalam batas normal (±2σ).
        </p>
      ) : (
        <div className="space-y-2">
          {visible.slice(0, 5).map((a) => (
            <div
              key={a.code}
              className={`rounded-xl border p-3 flex items-start gap-3 ${
                a.direction === "above"
                  ? "border-l-4 border-l-warning bg-warning/5"
                  : "border-l-4 border-l-destructive bg-destructive/5"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  z-score: <span className="font-bold">{a.zScore.toFixed(2)}</span> ·
                  Nilai: {a.value.toFixed(2)} · Mean: {a.mean.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(a.code)}
                className="p-1 rounded hover:bg-accent"
                title="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {dismissed.length > 0 && (
        <button
          onClick={() => { clearDismissedAnomalies(); setDismissed([]); }}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Reset dismissed ({dismissed.length})
        </button>
      )}
    </div>
  );
}
