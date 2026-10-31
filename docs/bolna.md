# Bolna custom LLM connection

Model: `flo-assistant` (Mira's model is selected through the existing Assistant settings).

Requested endpoints:
- `POST /api/bolna/v1/chat/completions`
- `GET /api/bolna/v1/models`

For external calls on the published site, use the public aliases, which still require the shared bearer token:
- Base URL: `https://conversationalaistudio.online/api/public/bolna/v1`
- Chat URL: `https://conversationalaistudio.online/api/public/bolna/v1/chat/completions`
- Models URL: `https://conversationalaistudio.online/api/public/bolna/v1/models`

Set Bolna's API key to the shared value saved securely as `BOLNA_API_TOKEN`. Bolna must send `Authorization: Bearer <configured token>`. Never use the studio AI gateway credential.

Publish these changes before configuring Bolna. No Bolna agent configuration or actual telephone call has been verified by this implementation.

Requests accept text `messages`, `model: "flo-assistant"`, and `stream: true` or `false`. Caller-provided system messages are ignored; Mira's instructions, business knowledge and tools remain server-owned. Responses use OpenAI completion JSON or SSE chunks ending with `[DONE]`. Usage is logged by Mira, but token counts are not fabricated in API responses.

Pass a unique per-call identity using `metadata.conversation_id`, `metadata.call_id`, `X-Bolna-Call-ID`, or `user`, in that priority order. Reuse it across turns of the same call, never across different callers. Server history preserves completed tools. Without an identity, each request uses an isolated conversation and the supplied text history. Public phone calls use only the fictional Aura sample; real business codes cannot activate private assistants. `TRY AURA` returns to the sample and `EXIT` starts a setup discussion. This API does not expose a history-reading endpoint.

## Telephone latency and interruptions

- This endpoint supports `stream: true` in the Chat Completions protocol; this is not a confirmed Bolna UI toggle. Bolna's custom-LLM documentation does not establish an exposed streaming switch. Non-streaming requests intentionally wait for the complete reply; inspect actual requests rather than asking users to find a nonexistent setting.
- The app forwards each text delta as it arrives, uses `no-transform` to discourage intermediary buffering, and aborts upstream generation when the response is cancelled. Bolna must cancel the previous HTTP response on barge-in; microphone detection and clearing spoken audio belong to Bolna, not this LLM endpoint.
- Model settings, current Aura facts and history conversion run concurrently per turn, without caching admin edits. The selected model is unchanged.
- Check Bolna's actual speech endpointing, interruption detection and streaming speech synthesis configuration before adjusting values. These settings are not accessible through the studio's current connections. Do not assume a model swap will fix silence detection or queued audio.
- A telephone recording alone cannot separate caller thinking time, transcription, model generation and voice playback delays. Verify turn-level timing and audible interruption behavior on a fresh published call after configuration changes.

## Engine choice and submission name

Recommended display name: **Mira — Always-On Clinic Assistant**. Keep the API model identifier `flo-assistant` unchanged.

Bolna's realtime speech-to-speech engine can reduce cascade stages but uses supported realtime models, not this custom Mira endpoint. Its documented tools support does not establish compatibility with this app's stored history, editable Aura knowledge or lead capture. Duplicate the agent for an A/B test; do not replace the existing agent until those functions and real-call interruptions pass.

For the existing cascade, Bolna documents endpointing around 250 ms as a latency starting point; tune against caller cut-offs, with linear delay and interruption thresholds reviewed separately. No remote Bolna settings have been changed here.

References: https://www.bolna.ai/docs/custom-llm-inference · https://www.bolna.ai/docs/speech-to-speech · https://www.bolna.ai/docs/concepts/latency · https://www.bolna.ai/docs/agent-setup/engine-tab

## Spoken hours and WhatsApp directions

Assistant knowledge uses 12-hour AM/PM times while Business editing inputs remain 24-hour. Spoken instructions require natural readings such as “one PM” and “ten thirty AM.” Aura's greeting briefly identifies the fictional demonstration; replies avoid repeatedly saying “sample clinic” while preserving brief safeguards for fees, bookings and illustrative directions.

Callers can message **AURA MAP** to **+91 63023 92274** using the existing WhatsApp entry point. The customer's incoming WhatsApp message triggers a reply containing the current admin-saved Aura map through the existing durable outbound/status path, without a model generation step. A phone call does not open WhatsApp's 24-hour customer-service window. This is a customer-initiated fallback, not the requested automatic delivery from a phone call. Automatic delivery is blocked on a confirmed WhatsApp recipient, consent, and an approved outbound template or a verified active customer-service window; no sender tool is connected to Bolna today. Never read a URL aloud or claim a map was sent. Delivery remains unverified until the receiver is published and a real customer message is tested.

## Homepage timing example

The displayed 180 ms STT, 320 ms LLM and 210 ms TTS values (710 ms total) are illustrative browser-cascade sample figures, not a measured benchmark. They exclude telephone/Bolna timing and do not describe website speech-to-speech calls. Actual per-turn browser timings are measured in the playground; stage sums alone are not end-to-end measurements because streaming work can overlap. Phone timing additionally depends on endpointing, telephony transport, Bolna orchestration, synthesis/playback and network delays.