import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Trash2, GitCompare, Beaker } from "lucide-react";
import { fetchCausalRelations, fetchIndicators, type Indicator } from "@/lib/dashboard";
import {
  getScenarios, saveScenario, deleteScenario,
  type SimulationScenario,
} from "@/lib/scenario-store";

export function ScenarioComparison() {
  const { data: indicators = [] } = useQuery({ queryKey: ["indicators"], queryFn: fetchIndicators });
  const { data: rels } = useQuery({ queryKey: ["causal"], queryFn: fetchCausalRelations });

  const [code, setCode] = useState("BI_RATE");
  const [delta, setDelta] = useState(1);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(() => getScenarios());
  const [scenarioName, setScenarioName] = useState("");

  const impacts = useMemo(() => {
    return (rels ?? []).filter((r) => r.from_code === code).map((r) => {
      const target = indicators.find((i) => i.code === r.to_code);
      const change = delta * r.strength;
      return { toCode: r.to_code, toName: target?.name ?? r.to_code, change, description: r.description ?? "", lagDays: r.lag_days };
    });
  }, [rels, code, delta, indicators]);

  function handleSave() {
    if (!scenarioName.trim()) return;
    const saved = saveScenario({
      name: scenarioName.trim(),
      indicatorCode: code,
      delta,
      impacts,
    });
    setScenarios((s) => [...s, saved]);
    setScenarioName("");
  }

  function handleDelete(id: string) {
    deleteScenario(id);
    setScenarios((s) => s.filter((sc) => sc.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Simulator */}
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Beaker className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Simulasi What-If</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pilih Indikator</label>
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              {indicators.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Perubahan: <span className="text-primary font-bold">{delta > 0 ? "+" : ""}{delta}%</span>
            </label>
            <input
              type="range" min={-20} max={20} step={0.5}
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </div>
        </div>

        {impacts.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">Dampak Prediksi</h4>
            {impacts.map((im) => (
              <div key={im.toCode} className="rounded-xl border bg-background p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{im.toName}</p>
                  <p className="text-xs text-muted-foreground">{im.description} · lag {im.lagDays} hari</p>
                </div>
                <div className={`text-right font-bold ${im.change > 0 ? "text-success" : "text-destructive"}`}>
                  {im.change > 0 ? "+" : ""}{im.change.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save scenario */}
        <div className="flex gap-2">
          <input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Nama skenario…"
            className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={!scenarioName.trim() || impacts.length === 0}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> Simpan
          </button>
        </div>
      </div>

      {/* Saved Scenarios Comparison */}
      {scenarios.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <GitCompare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Perbandingan Skenario ({scenarios.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium text-muted-foreground">Skenario</th>
                  <th className="py-2 px-2 font-medium text-muted-foreground">Indikator</th>
                  <th className="py-2 px-2 font-medium text-muted-foreground">Δ</th>
                  <th className="py-2 px-2 font-medium text-muted-foreground">Dampak</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((sc) => (
                  <tr key={sc.id} className="border-b hover:bg-accent/30">
                    <td className="py-2 px-2 font-semibold">{sc.name}</td>
                    <td className="py-2 px-2 font-mono text-xs">{sc.indicatorCode}</td>
                    <td className="py-2 px-2">
                      <span className={sc.delta >= 0 ? "text-success" : "text-destructive"}>
                        {sc.delta >= 0 ? "+" : ""}{sc.delta}%
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {sc.impacts.slice(0, 3).map((im) => (
                          <span key={im.toCode} className={`text-[10px] px-2 py-0.5 rounded-full ${im.change >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {im.toName}: {im.change >= 0 ? "+" : ""}{im.change.toFixed(1)}%
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <button onClick={() => handleDelete(sc.id)} className="p-1 rounded hover:bg-accent" title="Hapus">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
