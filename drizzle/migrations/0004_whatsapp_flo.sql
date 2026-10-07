CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id text NOT NULL UNIQUE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text,
  attempts int NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
GRANT SELECT ON public.whatsapp_webhook_events TO authenticated;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read wa events" ON public.whatsapp_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX whatsapp_webhook_events_pending ON public.whatsapp_webhook_events (next_attempt_at) WHERE processed_at IS NULL;

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id text UNIQUE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  phone text NOT NULL,
  body text NOT NULL DEFAULT '',
  conversation_id uuid REFERENCES public.assistant_conversations(id),
  in_reply_to uuid REFERENCES public.whatsapp_messages(id),
  status text NOT NULL DEFAULT 'received',
  status_times jsonb NOT NULL DEFAULT '{}'::jsonb,
  errors jsonb,
  reply_state text,
  reply_attempts int NOT NULL DEFAULT 0,
  reply_error text,
  reply_claimed_at timestamptz,
  provider_ts timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_messages TO service_role;
GRANT SELECT ON public.whatsapp_messages TO authenticated;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read wa messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX whatsapp_messages_reply ON public.whatsapp_messages (reply_state) WHERE direction = 'in';