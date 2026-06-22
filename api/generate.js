// /api/generate.js
//
// Serverless proxy for The Research Desk.
// Deploy this on Vercel (or any platform supporting Node serverless functions
// with this default-export signature, e.g. Vercel's /api directory convention).
//
// Why this file exists at all:
// Anthropic's API does not return CORS headers permitting direct browser-to-API
// calls from arbitrary origins, so the request must originate server-side.
// This function does NOT use its own API key — it takes the end user's key from
// the request body, makes one call on their behalf, and returns the result.
// The key is never logged, stored, or persisted anywhere in this function.

export default async function handler(req, res) {
  // Basic CORS for your own frontend origin — tighten this to your real domain in production.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { apiKey, model, system, prompt } = req.body || {};

  if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-ant-")) {
    return res.status(400).json({ error: "A valid Anthropic API key is required." });
  }
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "A prompt is required." });
  }

  // Basic sanity caps so a malformed request can't run away with someone's tokens.
  const safeModel = typeof model === "string" ? model : "claude-sonnet-4-6";
  const MAX_TOKENS = 4000;

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: safeModel,
        max_tokens: MAX_TOKENS,
        system: system || "",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      const message =
        (data && data.error && data.error.message) ||
        `Anthropic API error (${anthropicResponse.status})`;
      return res.status(anthropicResponse.status).json({ error: message });
    }

    const textBlock = (data.content || []).find((block) => block.type === "text");
    const text = textBlock ? textBlock.text : "";

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Proxy request failed: " + (err.message || String(err)) });
  }
}
