import { groq } from "@ai-sdk/groq";
import { createTextStreamResponse, streamText } from "ai";
import { embed } from "@/lib/muninn/embed";
import { citationsFromHits, searchIndex } from "@/lib/muninn";
import { formatContext, SYSTEM_PROMPT } from "@/lib/muninn/prompt";
import { checkMuninnRateLimit, getClientIp } from "@/lib/muninn/ratelimit";
import type { MuninnMessage } from "@/lib/muninn/types";

export const runtime = "edge";

const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 1000;

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function validMessages(value: unknown): value is MuninnMessage[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return false;
  }

  return value.every((message) => {
    if (!message || typeof message !== "object") return false;
    const candidate = message as Record<string, unknown>;
    return (
      (candidate.role === "user" || candidate.role === "assistant") &&
      typeof candidate.content === "string" &&
      candidate.content.length > 0 &&
      candidate.content.length <= MAX_MESSAGE_CHARS
    );
  });
}

export async function POST(req: Request) {
  const allowed = await checkMuninnRateLimit(getClientIp(req));
  if (!allowed) {
    return jsonError("Muninn is getting a lot of questions. Try again in a minute.", 429);
  }

  if (!process.env.GROQ_API_KEY) {
    return jsonError("Muninn is missing its Groq API key.", 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!validMessages(messages)) {
    return jsonError("Send 1-8 user/assistant messages, each under 1000 characters.", 400);
  }

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser) return jsonError("No question found.", 400);

  const queryVector = await embed(lastUser.content);
  const hits = searchIndex(queryVector, 6);
  const citations = citationsFromHits(hits);
  const context = formatContext(hits);

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `${SYSTEM_PROMPT}\n\nContext:\n${context}`,
    messages,
    temperature: 0.3,
    maxOutputTokens: 600,
  });

  return createTextStreamResponse({
    textStream: result.textStream,
    headers: {
      "x-muninn-citations": encodeURIComponent(JSON.stringify(citations)),
    },
  });
}
