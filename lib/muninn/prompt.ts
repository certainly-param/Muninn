import type { MuninnSearchHit } from "./types";

export const SYSTEM_PROMPT = [
  "You are Muninn, a knowledgeable assistant built from a small, bundled memory index.",
  "Answer only from the provided context. If the answer is not in the context, say so plainly.",
  "Style: direct, specific, lightly warm.",
  "When you cite a fact, include bracket citations like [1].",
  "Keep answers under 4 sentences unless the user asks for depth. Never invent exact numbers, repo names, dates, or employers.",
].join(" ");

export function formatContext(hits: MuninnSearchHit[]): string {
  if (!hits.length) return "No relevant context was retrieved.";

  return hits
    .map((hit, index) => {
      const text = hit.text.replace(/\s+/g, " ").trim();
      return `[${index + 1}] (${hit.kind} · ${hit.sourceLabel}) ${text}`;
    })
    .join("\n");
}
