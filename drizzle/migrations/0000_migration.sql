CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled session',
  mode text NOT NULL DEFAULT 'voice',
  compare boolean NOT NULL DEFAULT false,
  agents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations select" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own conversations insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own conversations update" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own conversations delete" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  agent text NOT NULL DEFAULT 'A',
  user_text text NOT NULL DEFAULT '',
  assistant_text text NOT NULL DEFAULT '',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX turns_conversation_idx ON public.turns(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turns TO authenticated;
GRANT ALL ON public.turns TO service_role;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own turns select" ON public.turns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own turns insert" ON public.turns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own turns delete" ON public.turns FOR DELETE TO authenticated USING (auth.uid() = user_id);