const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

type FeatureExtractionPipeline = (
  text: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers").then(async ({ env, pipeline }) => {
      env.allowRemoteModels = true;
      return pipeline("feature-extraction", MODEL_ID) as Promise<FeatureExtractionPipeline>;
    });
  }

  return extractorPromise;
}

export async function embed(text: string): Promise<Float32Array> {
  const extractor = await getExtractor();
  const output = await extractor(text.replace(/\s+/g, " ").trim(), {
    pooling: "mean",
    normalize: true,
  });

  return output.data instanceof Float32Array
    ? output.data
    : Float32Array.from(output.data);
}

export const embeddingModel = MODEL_ID;
