import { supabase } from "@/integrations/supabase/client";

export type Indicator = {
  id: string;
  code: string;
  name: string;
  category: "MACRO" | "MICRO";
  subcategory: string | null;
  unit: string;
  data_source: string;
  description: string | null;
  current_value: number;
  previous_value: number;
  change_pct: number;
  status: "GOOD" | "NORMAL" | "WARNING" | "CRITICAL";
  trend: "UP" | "DOWN" | "STABLE";
  last_update: string;
};

export type IndicatorPoint = { date: string; value: number };

export type Insight = {
  id: string;
  insight_type: string;
  title: string;
  related_indicator_codes: string[];
  insight_text: string;
  confidence_level: number;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH";
  generated_at: string;
};

export type CausalRelation = {
  id: string;
  from_code: string;
  to_code: string;
  strength: number;
  lag_days: number;
  confidence: number;
  description: string;
};

export async function fetchIndicators() {
  const { data, error } = await supabase.from("indicators").select("*").order("category");
  if (error) throw error;
  return data as Indicator[];
}

export async function fetchIndicatorSeries(indicatorId: string) {
  const { data, error } = await supabase
    .from("indicator_data")
    .select("date,value")
    .eq("indicator_id", indicatorId)
    .order("date");
  if (error) throw error;
  return (data ?? []) as IndicatorPoint[];
}

export async function fetchInsights() {
  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .order("generated_at", { ascending: false });
  if (error) throw error;
  return data as Insight[];
}

export async function fetchCausalRelations() {
  const { data, error } = await supabase.from("causal_relations").select("*");
  if (error) throw error;
  return data as CausalRelation[];
}

export function formatValue(v: number, unit: string) {
  if (unit === "IDR" || unit.startsWith("Rp")) return new Intl.NumberFormat("id-ID").format(v);
  if (unit === "poin" || unit === "indeks") return v.toLocaleString("id-ID");
  if (unit === "juta" || unit === "USD Miliar") return v.toFixed(1);
  return v.toFixed(2);
}
