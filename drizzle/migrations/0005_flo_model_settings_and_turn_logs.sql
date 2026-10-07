CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read settings" ON public.app_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assistant_turn_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.assistant_conversations(id) ON DELETE SET NULL,
  channel text NOT NULL,
  model text NOT NULL,
  first_token_ms integer,
  total_ms integer NOT NULL,
  input_tokens integer,
  output_tokens integer,
  steps integer,
  ok boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assistant_turn_logs_created_idx ON public.assistant_turn_logs (created_at DESC);
GRANT SELECT ON public.assistant_turn_logs TO authenticated;
GRANT ALL ON public.assistant_turn_logs TO service_role;
ALTER TABLE public.assistant_turn_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read turn logs" ON public.assistant_turn_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));