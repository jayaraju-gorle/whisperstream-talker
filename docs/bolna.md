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

- Set `stream: true` in Bolna's custom LLM requests. Non-streaming requests intentionally wait for the complete reply.
- The app forwards each text delta as it arrives, uses `no-transform` to discourage intermediary buffering, and aborts upstream generation when the response is cancelled. Bolna must cancel the previous HTTP response on barge-in; microphone detection and clearing spoken audio belong to Bolna, not this LLM endpoint.
- Model settings, current Aura facts and history conversion run concurrently per turn, without caching admin edits. The selected model is unchanged.
- Check Bolna's actual speech endpointing, interruption detection and streaming speech synthesis configuration before adjusting values. These settings are not accessible through the studio's current connections. Do not assume a model swap will fix silence detection or queued audio.
- A telephone recording alone cannot separate caller thinking time, transcription, model generation and voice playback delays. Verify turn-level timing and audible interruption behavior on a fresh published call after configuration changes.