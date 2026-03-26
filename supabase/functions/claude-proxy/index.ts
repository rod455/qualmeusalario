// supabase/functions/claude-proxy/index.ts
// Proxy seguro para a API do Claude — protege a API key no servidor

import "@supabase/functions-js/edge-runtime.d.ts";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!CLAUDE_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { system, messages, max_tokens } = await req.json();

    // Validações básicas
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
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
      console.error("Claude API error:", data);
      return new Response(
        JSON.stringify({ error: "Claude API error", detail: data.error?.message ?? "Unknown" }),
        {
          status: response.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Retorna apenas o texto da resposta (não expõe metadados da API)
    const text = data.content?.[0]?.text ?? "";

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
