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
- Catalog provider identifies the foundation vendor; optional connection identifies built-in transport, preserving saved model IDs and independent key availability. Only supported live models are listed to avoid misleading availability.
- Built-in playground Anthropic and Gemini additions use request-scoped AI SDK gateway providers in playground-llm.server.ts, preserving catalog IDs and normalizing streamed text and final usage to the pipeline protocol so saved comparisons remain compatible.
- Guest demo stays browser-only and ephemeral, shares AgentPanel and studio-defaults.ts with the playground for parity, and never imports paid runners or live connections to prevent anonymous credit abuse.
- Account profiles are initialized idempotently after confirmed sign-in instead of using a trigger on the managed auth schema.
- Live speech-to-speech calls use a persistent WebSocket relay (src/lib/live-relay.server.ts, dispatched in src/server.ts and a Vite dev plugin); the browser sends its auth token in app.start and the relay verifies it before opening a paid session.
- Costs are stored in USD; display currency is converted client-side from /api/public/rates (daily rates + edge-country suggestion) and the user's choice is saved in profiles.preferences.currency.
- Custom scenarios and knowledge bases are per-user rows; the system prompt is built client-side in src/lib/library.ts; cascade turns include only BM25-retrieved knowledge passages for the recent caller messages (no embeddings, zero added latency), while live calls get capped full knowledge since the relay has no per-turn hook and sent to /api/llm or the live relay, so all modes share one prompt builder.
- Legacy built-in scenarios and their sample knowledge are immutable client-side reference content shared across accounts; keeping them outside per-user rows prevents duplicate seeds and preserves the original wording.

- Mobile layouts use shrinkable grid tracks and shared touch-target rules; input docks remain in page flow on phones so configuration and conversations are not obscured.
- Loading feedback uses a shared root route/query progress indicator and explicit Button loading states; keep cancellation controls available and reserve button dimensions to prevent layout shifts.
- Website assistant (src/components/SiteAssistant.tsx, /api/public/assistant) keeps one server-stored conversation per random browser visitor id and saves leads via a model tool with the admin client; leads/conversations are readable only by user_roles admins, so visitor data never reaches other accounts.
- Assistant contact edits use the existing chat tool and update the lead scoped to the server-resolved conversation, avoiding duplicate leads or a separate public edit endpoint; the latest successful tool summary exposes the editor.
- Restarting Flo rotates the browser's random visitor identifier and remounts the chat after confirmation, preserving prior server records while isolating the new conversation.
- Flo on WhatsApp: signed callbacks land in whatsapp_webhook_events at /api/public/whatsapp/webhook; the webhook route awaits drainWhatsApp before acknowledging (gateway retries are safe via dedup + reply claims; each call also drains earlier pending events and releases stuck replies) with claimed reply states and deferred status reconciliation, sharing floTools/notifyNewLead with the web chat so behaviour and lead capture stay identical; WhatsApp conversations use the reserved whatsapp_<number> visitor id that the browser route rejects.
- Flo's AI model is chosen per site in the app_settings table (key flo_model) and resolved server-side against src/lib/flo-models.ts, so the web chat and WhatsApp always use the same validated model; every Flo turn is logged to assistant_turn_logs for model comparison.
- The assistant admin area retains /leads and reads web conversations through the authenticated browser client with paginated metadata and on-demand transcripts, excluding the reserved WhatsApp visitor prefix; this preserves public URLs and existing admin-only access policies without loading every transcript at once.
- Legacy WhatsApp reply metrics match successful WhatsApp turn logs by conversation and nearest preceding completion timestamp, never array index; this keeps unlogged older replies and failed attempts from shifting metrics onto the wrong messages.
- Receptionists share clinic-row storage, linked knowledge/scenarios and audience-aware helpers (business name/professional qualifications) across playground, web and WhatsApp to keep prompts and welcomes consistent.
- Agent configuration lists only the pipeline stages the active mode runs, so a typed flow never offers a transcription picker.
