import { QUEEN_SYSTEM_PROMPT } from "@/lib/queen-prompt";
import { isAuthorized } from "@/lib/queen-auth";

export const runtime = "edge";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MESSAGE =
  "The Queen is tired of yer noise. Try again in a bit.";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const ipHits = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const hits = (ipHits.get(ip) || []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT) {
    ipHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return true;
}

function getIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  if (!(await isAuthorized(req))) {
    return jsonError("Locked. Enter the password to talk to the Queen.", 401);
  }

  const ip = getIp(req);
  if (!rateLimit(ip)) return jsonError(RATE_LIMIT_MESSAGE, 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError("Bad request.", 400);
  }

  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return jsonError("Bad request.", 400);
  }
  const clean = [];
  for (const m of messages) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length === 0
    ) {
      return jsonError("Bad request.", 400);
    }
    clean.push({ role: m.role, content: m.content });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set");
    return jsonError("The Queen is unreachable. Try again later.", 500);
  }

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: QUEEN_SYSTEM_PROMPT,
        messages: clean,
        stream: true,
      }),
    });
  } catch (err) {
    console.error("Anthropic request failed:", err);
    return jsonError("The Queen is unreachable. Try again later.", 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("Anthropic non-OK:", upstream.status, detail.slice(0, 500));
    return jsonError("The Queen is unreachable. Try again later.", 502);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).replace(/\r$/, "");
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            let evt;
            try {
              evt = JSON.parse(data);
            } catch {
              continue;
            }
            if (
              evt?.type === "content_block_delta" &&
              evt.delta?.type === "text_delta" &&
              evt.delta.text
            ) {
              controller.enqueue(encoder.encode(evt.delta.text));
            }
          }
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
