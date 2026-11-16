CREATE TABLE public.phone_call_links (
  visitor_id text PRIMARY KEY,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.phone_call_links TO authenticated;
GRANT ALL ON public.phone_call_links TO service_role;
ALTER TABLE public.phone_call_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read call links" ON public.phone_call_links FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX phone_call_links_phone_idx ON public.phone_call_links (phone, created_at DESC);