import rawIndex from "@/data/muninn-index.json";
import type { MuninnCitation, MuninnIndex, MuninnSearchHit } from "./types";

const index = rawIndex as MuninnIndex;

function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function loadIndex(): MuninnIndex {
  return index;
}

export function searchIndex(queryVector: ArrayLike<number>, k = 6): MuninnSearchHit[] {
  return index.chunks
    .map((chunk) => ({
      ...chunk,
      score: dot(queryVector, chunk.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function citationsFromHits(hits: MuninnSearchHit[]): MuninnCitation[] {
  const seen = new Set<string>();
  const citations: MuninnCitation[] = [];

  for (const hit of hits) {
    const key = `${hit.sourceLabel}:${hit.sourceHref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      id: hit.id,
      label: hit.sourceLabel,
      href: hit.sourceHref,
      kind: hit.kind,
    });
    if (citations.length >= 3) break;
  }

  return citations;
}
