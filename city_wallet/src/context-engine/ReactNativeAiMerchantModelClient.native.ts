import {
  downloadModel,
  getModelPath,
  isModelDownloaded,
  llama,
  type LlamaLanguageModel,
} from "@react-native-ai/llama";
import { generateText, jsonSchema, Output as AiOutput, type JSONSchema7 } from "ai";

import type {
  LocalRecommendationRequest,
  LocalRecommendationResponse,
} from "@/src/types/city-wallet";

import {
  buildLocalModelPrompt,
  setLocalMerchantModelClient,
  type LocalMerchantModelClient,
} from "./LocalMerchantRecommender";

const DEFAULT_MODEL_ID =
  "Qwen/Qwen2.5-1.5B-Instruct-GGUF/qwen2.5-1.5b-instruct-q4_k_m.gguf";

const RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["merchantId"],
  properties: {
    merchantId: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasoningTags: {
      type: "array",
      items: { type: "string" },
    },
    rankedMerchantIds: {
      type: "array",
      items: { type: "string" },
    },
  },
};

type ModelRecommendationPayload = {
  merchantId: string;
  confidence?: unknown;
  reasoningTags?: unknown;
  rankedMerchantIds?: unknown;
};

const RESPONSE_OUTPUT = AiOutput.object<ModelRecommendationPayload>({
  schema: jsonSchema<ModelRecommendationPayload>(RESPONSE_SCHEMA),
  name: "merchant_recommendation",
});

let preparedModel: LlamaLanguageModel | null = null;
let preparedModelId: string | null = null;
let preparePromise: Promise<LlamaLanguageModel> | null = null;
let preparingModelId: string | null = null;

export function registerReactNativeAiMerchantModelClient() {
  setLocalMerchantModelClient(createReactNativeAiMerchantModelClient());
}

function createReactNativeAiMerchantModelClient(): LocalMerchantModelClient {
  return {
    async recommendMerchant(request) {
      const modelId = getConfiguredModelId();
      const model = await getPreparedModel(modelId);
      const { output: recommendation } = await generateText({
        model,
        prompt: buildLocalModelPrompt(request),
        temperature: 0.1,
        maxOutputTokens: 256,
        output: RESPONSE_OUTPUT,
      });

      return normalizeModelResponse(recommendation, request, modelId);
    },
  };
}

async function getPreparedModel(modelId: string) {
  if (preparedModel && preparedModelId === modelId) {
    return preparedModel;
  }

  if (preparePromise && preparingModelId === modelId) {
    return preparePromise;
  }

  preparingModelId = modelId;
  preparePromise = prepareModel(modelId).finally(() => {
    preparePromise = null;
    preparingModelId = null;
  });

  return preparePromise;
}

async function prepareModel(modelId: string) {
  if (preparedModel && preparedModelId !== modelId) {
    await preparedModel.unload().catch((error: unknown) => {
      console.warn("Failed to unload previous local merchant model.", error);
    });
    preparedModel = null;
    preparedModelId = null;
  }

  const modelPath = await ensureModelPath(modelId);
  const model = llama.languageModel(modelPath, {
    contextParams: {
      n_ctx: 2048,
      n_gpu_layers: 99,
    },
  });

  await model.prepare();
  preparedModel = model;
  preparedModelId = modelId;

  return model;
}

async function ensureModelPath(modelId: string) {
  if (await isModelDownloaded(modelId)) {
    return getModelPath(modelId);
  }

  let lastLoggedProgress = -10;
  return downloadModel(modelId, (progress) => {
    if (progress.percentage >= lastLoggedProgress + 10) {
      lastLoggedProgress = progress.percentage;
      console.log(`Local merchant model download: ${progress.percentage}%`);
    }
  });
}

function getConfiguredModelId() {
  return process.env.EXPO_PUBLIC_ON_DEVICE_MODEL_ID?.trim() || DEFAULT_MODEL_ID;
}

function normalizeModelResponse(
  parsed: ModelRecommendationPayload,
  request: LocalRecommendationRequest,
  modelId: string,
): LocalRecommendationResponse {
  const knownMerchantIds = new Set(request.merchants.map((merchant) => merchant.id));

  if (!knownMerchantIds.has(parsed.merchantId)) {
    throw new Error(`Local model recommended unknown merchant ${parsed.merchantId}`);
  }

  return {
    merchantId: parsed.merchantId,
    confidence: clampConfidence(parsed.confidence),
    reasoningTags: ["native_gguf_model", ...normalizeStringArray(parsed.reasoningTags)],
    rankedMerchantIds: normalizeRankedMerchantIds(parsed, knownMerchantIds),
    modelId,
    modelSource: "native_gguf",
  };
}

function clampConfidence(confidence: unknown) {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return undefined;
  }

  return Math.min(1, Math.max(0, confidence));
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeRankedMerchantIds(
  parsed: { merchantId: string; rankedMerchantIds?: unknown },
  knownMerchantIds: Set<string>,
) {
  return Array.from(
    new Set([parsed.merchantId, ...normalizeStringArray(parsed.rankedMerchantIds)]),
  ).filter((merchantId) => knownMerchantIds.has(merchantId));
}
