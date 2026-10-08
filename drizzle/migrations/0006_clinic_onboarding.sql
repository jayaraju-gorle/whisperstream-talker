CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  emergency_phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  doctors jsonb NOT NULL DEFAULT '[]'::jsonb,
  insurance text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  scenario_id uuid,
  kb_id uuid,
  test_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage own clinics" ON public.clinics FOR ALL TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.clinic_appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'Browser',
  patient_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  preferred_time text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_appointment_requests TO authenticated;
GRANT ALL ON public.clinic_appointment_requests TO service_role;
ALTER TABLE public.clinic_appointment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic owners manage requests" ON public.clinic_appointment_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.clinic_whatsapp_sessions (
  phone text PRIMARY KEY,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clinic_whatsapp_sessions TO authenticated;
GRANT ALL ON public.clinic_whatsapp_sessions TO service_role;
ALTER TABLE public.clinic_whatsapp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read clinic wa sessions" ON public.clinic_whatsapp_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.conversations ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL;