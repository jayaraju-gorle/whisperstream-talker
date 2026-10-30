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

Pass a unique per-call identity using `metadata.conversation_id`, `metadata.call_id`, `X-Bolna-Call-ID`, or `user`, in that priority order. Reuse it across turns of the same call, never across different callers. Server history preserves tools and TRY/EXIT state. Without an identity, each request uses an isolated conversation and the supplied text history. Use `TRY SSK`, `TRY IVY`, or `TRY IYASHI` to switch business assistants and `EXIT` to return to Mira. This API does not expose a history-reading endpoint.