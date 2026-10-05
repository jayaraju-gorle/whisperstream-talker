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
- Guest access is a public, static demo route; paid AI endpoints remain authenticated to prevent anonymous credit abuse.
- Account profiles are initialized idempotently after confirmed sign-in instead of using a trigger on the managed auth schema.
