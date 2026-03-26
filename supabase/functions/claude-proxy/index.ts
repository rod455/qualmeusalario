// supabase/functions/claude-proxy/index.ts
// Proxy seguro para a API do Claude — protege a API key no servidor
// Inclui rate limiting por IP e validação de input

import "@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting simples por IP (em memória — reseta a cada cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // máximo de requests por janela
const RATE_WINDOW_MS = 60_000; // janela de 1 minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!CLAUDE_API_KEY) {
    return jsonResponse({ error: "API key not configured" }, 500);
  }

  // Rate limiting
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("cf-connecting-ip")
    ?? "unknown";

  if (isRateLimited(clientIP)) {
    return jsonResponse({ error: "Too many requests. Try again in a minute." }, 429);
  }

  try {
    const body = await req.json();
    const { system, messages, max_tokens } = body;

    // Validação de messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "Messages required" }, 400);
    }

    // Validação de cada mensagem
    if (messages.length > 20) {
      return jsonResponse({ error: "Too many messages (max 20)" }, 400);
    }

    for (const msg of messages) {
      if (!msg.role || !["user", "assistant"].includes(msg.role)) {
        return jsonResponse({ error: "Invalid message role" }, 400);
      }
      if (typeof msg.content !== "string" || msg.content.length > 2000) {
        return jsonResponse({ error: "Message content too long (max 2000 chars)" }, 400);
      }
    }

    // Validação do system prompt
    if (system && (typeof system !== "string" || system.length > 2000)) {
      return jsonResponse({ error: "System prompt too long (max 2000 chars)" }, 400);
    }

    // Limita tokens para evitar abuso
    const safeMaxTokens = Math.min(max_tokens ?? 300, 500);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: safeMaxTokens,
        system: system ?? "",
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Claude API error:", JSON.stringify(data));
      return jsonResponse({ error: "AI service unavailable" }, 502);
    }

    const text = data.content?.[0]?.text ?? "";

    return jsonResponse({ text });
  } catch (err) {
    console.error("Proxy error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
