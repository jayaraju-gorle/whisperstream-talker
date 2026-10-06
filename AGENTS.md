<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Voice pipeline is browser-orchestrated (src/lib/pipeline.ts): server routes /api/stt, /api/llm, /api/tts only proxy providers so API keys stay server-side; /api/tts always returns raw 24 kHz s16le PCM so the player is provider-agnostic.
- Provider/model catalog and pricing live in src/lib/catalog.ts; adding a provider means a catalog entry plus a branch in each relevant /api route.
- Catalog provider identifies the foundation vendor; optional connection identifies built-in transport, preserving saved model IDs and independent key availability. Retired models are sample-only and rejected before paid requests.
- Guest access is a public browser-only sample playground with ephemeral scenarios, knowledge and history; it shares AgentPanel with the authenticated playground to preserve visual parity, and never imports paid runners or live connections, preventing anonymous credit abuse.
- Account profiles are initialized idempotently after confirmed sign-in instead of using a trigger on the managed auth schema.
- Live speech-to-speech calls use a persistent WebSocket relay (src/lib/live-relay.server.ts, dispatched in src/server.ts and a Vite dev plugin); the browser sends its auth token in app.start and the relay verifies it before opening a paid session.
- Costs are stored in USD; display currency is converted client-side from /api/public/rates (daily rates + edge-country suggestion) and the user's choice is saved in profiles.preferences.currency.
- Custom scenarios and knowledge bases are per-user rows; the system prompt is built client-side in src/lib/library.ts; cascade turns include only BM25-retrieved knowledge passages for the recent caller messages (no embeddings, zero added latency), while live calls get capped full knowledge since the relay has no per-turn hook and sent to /api/llm or the live relay, so all modes share one prompt builder.
- Legacy built-in scenarios and their sample knowledge are immutable client-side reference content shared across accounts; keeping them outside per-user rows prevents duplicate seeds and preserves the original wording.

- Mobile layouts use shrinkable grid tracks and shared touch-target rules; input docks remain in page flow on phones so configuration and conversations are not obscured.
