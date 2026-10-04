# Conversational AI Flows Studio

**Live:** [conversationalaistudio.online](https://conversationalaistudio.online)

A browser-based test bench for **voice and text** conversational AI. Pick a speech-to-text (STT), language model (LLM) and text-to-speech (TTS) provider, talk or type, and measure latency and cost for every turn. You can also run two agent setups side by side.

Built with TanStack Start (React 19), Vite 7, Tailwind CSS v4 and Lovable Cloud.

---

## Features

- **Live voice mode**: mic capture through the Web Audio API with energy-based voice activity detection. Barge-in stops the agent when you start talking.
- **Text mode**: test LLM stacks without any speech providers.
- **Swappable providers**: Lovable AI Gateway, OpenAI, Groq, Deepgram, ElevenLabs.
- **Streaming throughout**: LLM tokens stream in, get split into sentences on the client, and each sentence goes to TTS right away, so the agent starts speaking before the full reply is done.
- **Metrics for every turn**: STT time, LLM time to first token, TTS time to first audio, voice-to-voice delay, token counts and estimated cost, plus session totals.
- **Compare mode**: one input runs through Agent A and Agent B at the same time.
- **Scenarios**: general assistant, hospital, bank and e-commerce personas, in several languages.
- **History**: signed-in users get every session saved, with per-turn transcripts and metrics.

## Architecture

```text
 Browser                                         Server routes (keys stay here)
 ┌──────────────────────────────────────┐
 │ MicCapture (VAD, 16 kHz WAV)  ───────┼──▶ /api/stt  ──▶ STT provider
 │        │ transcript                  │
 │        ▼                             │
 │ AgentRunner ─────────────────────────┼──▶ /api/llm  ──▶ LLM provider (NDJSON stream)
 │        │ token stream                │
 │        ▼                             │
 │ SentenceChunker ── per sentence ─────┼──▶ /api/tts  ──▶ TTS provider
 │        ▲                             │       (always 24 kHz s16le PCM)
 │ PcmPlayer (ordered playback) ◀───────┘
 └──────────────────────────────────────┘
```

The browser runs the pipeline. The server routes only proxy requests to providers, so API keys never reach the client. Every TTS provider's output is converted to raw 24 kHz PCM, which keeps the player independent of the provider.

## Project structure

```text
src/
  lib/
    catalog.ts           Provider/model catalog, pricing, scenarios, cost math
    pipeline.ts          AgentRunner: STT → LLM → chunker → TTS, metrics
    sentence-chunker.ts  Streaming sentence splitter
    audio/engine.ts      AudioContext, PcmPlayer, MicCapture (VAD)
    server/auth.server.ts Request auth + provider helpers
  routes/
    index.tsx            Public landing page
    auth.tsx             Sign in (email/password, Google)
    api/{providers,stt,llm,tts}.ts
    _authenticated/      Playground, History, Session detail
```

## Adding a provider

1. Add an entry with models and pricing in `src/lib/catalog.ts`.
2. Add a branch to each relevant `/api` route (`stt`, `llm`, `tts`).
3. Store the provider's API key as a server secret.

## Local development

```bash
bun install
bun run dev        # http://localhost:8080
bunx vitest run    # unit tests
```

Environment: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (client). Server secrets as needed: `LOVABLE_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`.

## Notes

- Costs are estimates based on public list prices.
- Use headphones in voice mode so the agent doesn't pick up its own audio.

Inspired by [conversational-ai-playground](https://github.com/jayaraju-gorle/conversational-ai-playground).
