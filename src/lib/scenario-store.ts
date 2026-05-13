// Scenario Comparison — save/load simulation scenarios from localStorage.

export type SimulationScenario = {
  id: string;
  name: string;
  createdAt: string;
  indicatorCode: string;
  delta: number;
  impacts: Array<{
    toCode: string;
    toName: string;
    change: number;
    description: string;
    lagDays: number;
  }>;
};

const SCENARIOS_KEY = "MACROMIC_SCENARIOS";

export function getScenarios(): SimulationScenario[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SCENARIOS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveScenario(scenario: Omit<SimulationScenario, "id" | "createdAt">): SimulationScenario {
  const full: SimulationScenario = {
    ...scenario,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const list = getScenarios();
  list.push(full);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(list));
  return full;
}

export function deleteScenario(id: string) {
  const list = getScenarios().filter((s) => s.id !== id);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(list));
}

export function clearScenarios() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SCENARIOS_KEY);
}
