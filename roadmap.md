- [x] Hide the published-site Lovable badge.
- [x] Add a no-cost guest demo and a close action on sign-in.
- [x] Match the guest demo to the playground: voice/text/live samples, comparison, simulation, local library and history; no paid AI requests.
- [x] Create account profiles and initialize them when users sign in.
- [x] Verify guest navigation and protected live AI access.- [x] Scenario simulation (auto-play sample conversations)
- [x] Multi-currency display with location default and saved preference
- [x] Sarvam STT/LLM/TTS models (waiting on SARVAM_API_KEY)
- [x] Built-in Live S2S calls
- [ ] Gemini Live S2S — blocked: needs a Google AI key
- [ ] OpenAI Realtime S2S — blocked: needs an OpenAI key

- [x] Custom scenarios with caller lines, runnable in the simulator
- [x] Knowledge bases attachable to scenarios or any session
- [x] Per-reply passage retrieval from knowledge bases
- [x] Prefill built-in scenarios and sample knowledge from the original playground

## Business roadmap (internal only)
- [x] Rename admin navigation and header to Assistant; organize Leads, Web conversations, WhatsApp and Flo model tabs; add paginated web conversation transcripts.
- [x] Google Search Console: verification meta tag live, sitemap submitted (0 errors)
- [ ] Google Search Console: Request Indexing on the homepage
- [x] GA4 analytics: gtag.js in root layout, page views on client-side route changes (measurement ID via connector)
- [x] Homepage copy refresh: all providers listed, demo mode and comparison described, feature cards polished
- [ ] Industry PM Playbooks (/playbooks + /playbooks/$slug, Article JSON-LD, "Simulate in Studio" links) — drafts approved in chat
- [x] Flo on WhatsApp (webhook inbox, replies, leads, email alerts) — needs publish + Incoming messages destination set to this project
- [ ] On-site WhatsApp QR / "Chat on WhatsApp" button
- [ ] Telephony / SIP inbound voice (future)

- [x] Verify and optimize studio layouts for mobile, including demo, library and history.
- [x] Update public provider attribution; add Anthropic Claude 3.5 sample-only options and xAI Grok with pricing; verify tests and preview.
- [ ] Enable live Grok calls — blocked: needs an xAI API key; routing verified with mocked streaming responses.
- [x] Replace old Claude sample entries with Sonnet 5 and Haiku 4.5, native streaming, accurate pricing and updated tests (38 passing; preview build clean).
- [ ] Verify live Anthropic responses — blocked: ANTHROPIC_API_KEY is not configured; native streaming verified with mocked provider responses.
- [x] Visible navigation progress and loading feedback for delayed actions across the studio; browser checked navigation, demo replies, and sign-in error recovery.
- [x] Website assistant Flo with lead capture and Leads page
- [x] Email notification for new leads (Resend → gorlej2015@email.iimcal.ac.in)
- [x] Friendly contact-us wording, optional phone nudge and editable shared contact summaries in Flo; live reply, editor, visitor-scoped update and regression tests verified.
- [x] Add a confirmed restart-conversation action to Flo while retaining previously saved leads; confirmation, cancellation and new visitor identity verified.
