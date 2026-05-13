
CREATE TABLE public.indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('MACRO','MICRO')),
  subcategory text,
  unit text NOT NULL,
  data_source text NOT NULL,
  description text,
  current_value numeric,
  previous_value numeric,
  change_pct numeric,
  status text CHECK (status IN ('GOOD','NORMAL','WARNING','CRITICAL')),
  trend text CHECK (trend IN ('UP','DOWN','STABLE')),
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.indicator_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id uuid REFERENCES public.indicators(id) ON DELETE CASCADE,
  date date NOT NULL,
  value numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_indicator_data_indicator_date ON public.indicator_data(indicator_id, date);

CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL CHECK (insight_type IN ('ANOMALY','FORECAST','CAUSAL','ALERT','EDUCATION')),
  title text NOT NULL,
  related_indicator_codes text[] DEFAULT '{}',
  insight_text text NOT NULL,
  confidence_level numeric DEFAULT 0.85,
  severity text CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH')),
  generated_at timestamptz DEFAULT now()
);

CREATE TABLE public.causal_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_code text NOT NULL,
  to_code text NOT NULL,
  strength numeric NOT NULL,
  lag_days integer NOT NULL DEFAULT 7,
  confidence numeric NOT NULL DEFAULT 0.8,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causal_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read indicators" ON public.indicators FOR SELECT USING (true);
CREATE POLICY "public read indicator_data" ON public.indicator_data FOR SELECT USING (true);
CREATE POLICY "public read ai_insights" ON public.ai_insights FOR SELECT USING (true);
CREATE POLICY "public read causal_relations" ON public.causal_relations FOR SELECT USING (true);
