import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import type { LlmModel } from "@/lib/catalog";
import { GATEWAY, json, upstreamError } from "./auth.server";
import { createLovableAiGatewayProvider } from "./gateway-helpers.server";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./run-id.ts";

export async function streamPlaygroundGateway(
  request: Request,
  model: LlmModel,
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return json({ error: "Built-in AI is not configured" }, 500);
  const runId = getLovableAiGatewayRunId(request);
  const gateway = createLovableAiGatewayRunIdFetch(runId);
  let failedResponse: Response | undefined;
  const fetchWithStatus: typeof fetch = async (input, init) => {
    const response = await gateway.fetch(input, init);
    if (!response.ok) failedResponse = response.clone();
    return response;
  };
  const isClaude = model.provider === "anthropic";
  const compatible = createLovableAiGatewayProvider(key, runId, { baseURL: GATEWAY });
  const languageModel = isClaude
    ? createAnthropic({ baseURL: GATEWAY, apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: fetchWithStatus })(model.model)
    : compatible(model.model);
  const result = streamText({
    model: languageModel,
    system,
    messages,
    // Preserve the existing Claude output budget during this transport migration.
    ...(isClaude ? { maxOutputTokens: 1024 } : {}),
    maxRetries: 0,
    abortSignal: request.signal,
  });
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") send({ t: "d", v: part.text });
          else if (part.type === "finish") {
            if (part.finishReason === "content-filter") send({ t: "e", error: "The model declined this request." });
            else send({ t: "u", in: part.totalUsage.inputTokens ?? 0, out: part.totalUsage.outputTokens ?? 0 });
          } else if (part.type === "error") {
            send({ t: "e", error: part.error instanceof Error ? part.error.message : String(part.error) });
            break;
          }
        }
      } catch (error) {
        if (!request.signal.aborted) send({ t: "e", error: error instanceof Error ? error.message : "Model stream failed" });
      } finally {
        controller.close();
      }
    },
  });
  const correlation = isClaude ? gateway : compatible;
  // Only wait for upstream headers, never for the generated answer.
  await correlation.waitForRunId();
  if (request.signal.aborted) return new Response(null, { status: 499 });
  if (failedResponse) return upstreamError(failedResponse, "Model");
  return withLovableAiGatewayRunIdHeader(new Response(body, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache, no-transform" },
  }), correlation);
}