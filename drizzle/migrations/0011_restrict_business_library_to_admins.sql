CREATE OR REPLACE FUNCTION public.is_business_library_record(record_id uuid, record_kind text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clinics WHERE (record_kind = 'scenario' AND scenario_id = record_id) OR (record_kind = 'knowledge' AND kb_id = record_id));
$$;
REVOKE ALL ON FUNCTION public.is_business_library_record(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_library_record(uuid, text) TO authenticated, service_role;
CREATE POLICY "business scenarios require admin" ON public.custom_scenarios AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.is_business_library_record(id, 'scenario') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (NOT public.is_business_library_record(id, 'scenario') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "business knowledge requires admin" ON public.knowledge_bases AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.is_business_library_record(id, 'knowledge') OR public.has_role(auth.uid(), 'admin')) WITH CHECK (NOT public.is_business_library_record(id, 'knowledge') OR public.has_role(auth.uid(), 'admin'));