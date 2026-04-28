import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const corpusPath = path.join(root, "data", "corpus.json");
const outPath = path.join(root, "data", "muninn-index.json");
const embeddingModel = "Xenova/all-MiniLM-L6-v2";

let extractor;

async function embed(text) {
  if (!extractor) {
    const { env, pipeline } = await import("@xenova/transformers");
    env.allowRemoteModels = true;
    extractor = await pipeline("feature-extraction", embeddingModel);
  }

  const output = await extractor(text.replace(/\s+/g, " ").trim(), {
    pooling: "mean",
    normalize: true,
  });

  return output.data;
}

async function main() {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));
  const chunks = Array.from(new Map(corpus.map((chunk) => [chunk.id, chunk])).values())
    .filter((chunk) => chunk.text?.trim());

  const indexed = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const item = chunks[i];
    const vector = Array.from(await embed(item.text), (value) => Number(value.toFixed(7)));
    indexed.push({ ...item, vector });
    console.log(`[muninn-index] embedded ${i + 1}/${chunks.length}`);
  }

  const index = {
    generatedAt: new Date().toISOString(),
    model: embeddingModel,
    dimensions: indexed[0]?.vector.length ?? 0,
    chunks: indexed,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`);
  const bytes = fs.statSync(outPath).size;
  console.log(`[muninn-index] wrote ${indexed.length} chunks, ${(bytes / 1024).toFixed(1)} KB -> ${path.relative(root, outPath)}`);
}

main().catch((err) => {
  console.error("[muninn-index] build failed");
  console.error(err);
  process.exitCode = 1;
});
