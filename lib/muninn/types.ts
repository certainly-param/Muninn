export type MuninnChunkKind =
  | "resume"
  | "cv"
  | "project"
  | "role"
  | "oss"
  | "paper"
  | "talk"
  | "education"
  | "about"
  | "practice"
  | "blog"
  | "pr";

export type MuninnChunk = {
  id: string;
  source: string;
  sourceLabel: string;
  sourceHref: string;
  kind: MuninnChunkKind;
  text: string;
};

export type MuninnIndexedChunk = MuninnChunk & {
  vector: number[];
};

export type MuninnIndex = {
  generatedAt: string;
  model: string;
  dimensions: number;
  chunks: MuninnIndexedChunk[];
};

export type MuninnCitation = {
  id: string;
  label: string;
  href: string;
  kind: MuninnChunkKind;
};

export type MuninnMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type MuninnSearchHit = MuninnIndexedChunk & {
  score: number;
};
