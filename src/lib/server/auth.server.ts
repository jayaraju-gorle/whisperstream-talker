import { createClient } from "@supabase/supabase-js";

/** Verifies the bearer token on a raw API request. Returns userId or a 401 Response. */
export async function verifyRequest(request: Request): Promise<{ userId: string } | Response> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token.split(".").length !== 3) return json({ error: "Please sign in." }, 401);
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return json({ error: "Backend not configured" }, 500);
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return json({ error: "Session expired. Please sign in again." }, 401);
  return { userId: data.claims.sub };
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export function gatewayHeaders(extra: Record<string, string> = {}) {
  return {
    "Lovable-API-Key": process.env["LOVABLE_API_KEY"] ?? "",
    "X-Lovable-AIG-SDK": "fetch",
    ...extra,
  };
}

export function providerKey(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** Turn an upstream error response into a readable JSON error with the same status. */
export async function upstreamError(res: Response, label: string) {
  let message = `${label} failed (${res.status})`;
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      message = j?.error?.message ?? j?.message ?? j?.err_msg ?? j?.detail?.message ?? (typeof j?.error === "string" ? j.error : message);
    } catch {
      if (text) message = `${label}: ${text.slice(0, 300)}`;
    }
  } catch {
    /* ignore */
  }
  return json({ error: message }, res.status);
}

/** Minimal SSE reader: yields parsed JSON payloads of `data:` lines. */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<any> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.search(/\r?\n\r?\n/)) >= 0) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx).replace(/^\r?\n\r?\n/, "");
      const data = raw
        .split(/\r?\n/)
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trimStart())
        .join("\n");
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data);
      } catch {
        /* skip non-JSON */
      }
    }
  }
}
