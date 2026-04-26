import {
  downloadModel,
  getModelPath,
  isModelDownloaded,
  llama,
  removeModel,
  type LlamaLanguageModel,
} from "@react-native-ai/llama";
import { generateText, jsonSchema, Output as AiOutput, type JSONSchema7 } from "ai";
import Constants from "expo-constants";
import { Platform } from "react-native";

import type {
  LocalRecommendationRequest,
  LocalRecommendationResponse,
} from "@/src/types/city-wallet";

import {
  buildLocalRankingSignals,
  buildLocalIntentPrompt,
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

const INTENT_RESPONSE_SCHEMA: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["userIntent"],
  properties: {
    userIntent: { type: "string" },
  },
};

type ModelRecommendationPayload = {
  merchantId: string;
  confidence?: unknown;
  reasoningTags?: unknown;
  rankedMerchantIds?: unknown;
};

type ModelIntentPayload = {
  userIntent: unknown;
};

const RESPONSE_OUTPUT = AiOutput.object<ModelRecommendationPayload>({
  schema: jsonSchema<ModelRecommendationPayload>(RESPONSE_SCHEMA),
  name: "merchant_recommendation",
});

const INTENT_OUTPUT = AiOutput.object<ModelIntentPayload>({
  schema: jsonSchema<ModelIntentPayload>(INTENT_RESPONSE_SCHEMA),
  name: "user_intent",
});

let preparedModel: LlamaLanguageModel | null = null;
let preparedModelId: string | null = null;
let preparePromise: Promise<LlamaLanguageModel> | null = null;
let preparingModelId: string | null = null;
const PIPELINE_LOG_PREVIEW_CHARS = 1400;
const MODEL_GENERATION_TIMEOUT_MS = 30_000;
const ENABLE_FULL_PIPELINE_LOGS =
  process.env.EXPO_PUBLIC_LOCAL_MODEL_PIPELINE_FULL_LOGS?.toLowerCase() === "true";
const ENABLE_STRUCTURED_OUTPUT =
  process.env.EXPO_PUBLIC_LOCAL_MODEL_STRUCTURED_OUTPUT?.toLowerCase() === "true";

export function registerReactNativeAiMerchantModelClient() {
  if (Constants.appOwnership === "expo") {
    console.info(
      "Running in Expo Go: skipping on-device merchant model and using fallback recommender.",
    );
    return;
  }
  const localModelEnabled =
    process.env.EXPO_PUBLIC_ENABLE_LOCAL_MODEL?.toLowerCase() === "true";
  if (__DEV__ && !localModelEnabled) {
    console.info(
      "Local merchant model disabled in dev build. Set EXPO_PUBLIC_ENABLE_LOCAL_MODEL=true to enable.",
    );
    return;
  }
  setLocalMerchantModelClient(createReactNativeAiMerchantModelClient());
}

function createReactNativeAiMerchantModelClient(): LocalMerchantModelClient {
  return {
    async recommendMerchant(request, options) {
      const requestId = createPipelineRequestId();
      const modelId = getConfiguredModelId();
      const abortSignal = options?.signal;
      logModelPipeline("request_start", {
        requestId,
        modelId,
        merchantCount: request.merchants.length,
        rankingSignalCount: buildLocalRankingSignals(request).length,
      });
      logModelPipeline("prepare_start", { requestId, modelId });
      const model = await getPreparedModel(modelId);
      logModelPipeline("prepare_success", { requestId, modelId });
      const prompt = buildLocalModelPrompt(request);
      let recommendation: ModelRecommendationPayload;
      if (ENABLE_STRUCTURED_OUTPUT) {
        try {
          recommendation = await generateStructuredRecommendation(
            model,
            prompt,
            modelId,
            requestId,
            abortSignal,
          );
        } catch (structuredError) {
          if (isAbortError(structuredError)) {
            logModelPipeline("request_failure", {
              requestId,
              modelId,
              reason: "aborted_during_structured_generation",
              structuredError,
            });
            throw structuredError;
          }
          recommendation = await generateTextRecommendation(
            model,
            prompt,
            modelId,
            requestId,
            structuredError,
            abortSignal,
            "fallback",
          );
        }
      } else {
        recommendation = await generateTextRecommendation(
          model,
          prompt,
          modelId,
          requestId,
          "structured output disabled for local model",
          abortSignal,
          "text",
        );
      }

      const intentPrompt = buildLocalIntentPrompt(request, {
        merchantId: recommendation.merchantId,
        reasoningTags: normalizeStringArray(recommendation.reasoningTags),
      });
      const userIntent = await generateUserIntent(
        model,
        intentPrompt,
        request,
        modelId,
        requestId,
        abortSignal,
      );

      const normalized = normalizeModelResponse(recommendation, userIntent, request, modelId);
      logModelPipeline("request_success", { requestId, modelId, normalized });
      return normalized;
    },
  };
}

async function generateUserIntent(
  model: LlamaLanguageModel,
  prompt: string,
  request: LocalRecommendationRequest,
  modelId: string,
  requestId: string,
  abortSignal?: AbortSignal,
) {
  let intentPayload: ModelIntentPayload;
  if (ENABLE_STRUCTURED_OUTPUT) {
    try {
      intentPayload = await generateStructuredIntent(
        model,
        prompt,
        modelId,
        requestId,
        abortSignal,
      );
    } catch (structuredError) {
      if (isAbortError(structuredError)) {
        throw structuredError;
      }
      intentPayload = await generateTextIntent(
        model,
        prompt,
        request,
        modelId,
        requestId,
        structuredError,
        abortSignal,
        "intent_fallback",
      );
    }
  } else {
    intentPayload = await generateTextIntent(
      model,
      prompt,
      request,
      modelId,
      requestId,
      "structured output disabled for local intent",
      abortSignal,
      "intent_text",
    );
  }

  return normalizeIntent(intentPayload.userIntent, request);
}

async function generateStructuredRecommendation(
  model: LlamaLanguageModel,
  prompt: string,
  modelId: string,
  requestId: string,
  abortSignal?: AbortSignal,
) {
  logModelPipeline("structured_input", { requestId, modelId, promptLength: prompt.length, prompt });
  const { output } = await withGenerationTimeout(
    requestId,
    modelId,
    "structured_generation",
    abortSignal,
    (signal) =>
      generateText({
        model,
        prompt,
        temperature: 0.1,
        maxOutputTokens: 256,
        output: RESPONSE_OUTPUT,
        abortSignal: signal,
      }),
  );
  logModelPipeline("structured_output", { requestId, modelId, output });
  return output;
}

async function generateStructuredIntent(
  model: LlamaLanguageModel,
  prompt: string,
  modelId: string,
  requestId: string,
  abortSignal?: AbortSignal,
) {
  logModelPipeline("intent_structured_input", {
    requestId,
    modelId,
    promptLength: prompt.length,
    prompt,
  });
  const { output } = await withGenerationTimeout(
    requestId,
    modelId,
    "intent_structured_generation",
    abortSignal,
    (signal) =>
      generateText({
        model,
        prompt,
        temperature: 0.1,
        maxOutputTokens: 120,
        output: INTENT_OUTPUT,
        abortSignal: signal,
      }),
  );
  logModelPipeline("intent_structured_output", { requestId, modelId, output });
  return output;
}

async function generateTextRecommendation(
  model: LlamaLanguageModel,
  prompt: string,
  modelId: string,
  requestId: string,
  structuredError: unknown,
  abortSignal?: AbortSignal,
  stagePrefix = "fallback",
) {
  if (stagePrefix === "fallback") {
    console.info(
      "Structured local-model parsing failed; using tolerant JSON extraction fallback.",
      structuredError,
    );
  }
  const fallbackPrompt = `${prompt}\n\nReturn only one JSON object and nothing else.`;
  logModelPipeline(`${stagePrefix}_input`, {
    requestId,
    modelId,
    triggerReason: structuredError,
    promptLength: fallbackPrompt.length,
    prompt: fallbackPrompt,
  });
  const { text } = await withGenerationTimeout(
    requestId,
    modelId,
    "fallback_generation",
    abortSignal,
    (signal) =>
      generateText({
        model,
        prompt: fallbackPrompt,
        temperature: 0.05,
        maxOutputTokens: 192,
        abortSignal: signal,
      }),
  );
  logModelPipeline(`${stagePrefix}_output_raw_text`, {
    requestId,
    modelId,
    textLength: text.length,
    text,
  });

  const parsed = extractJsonObjectFromText(text);
  logModelPipeline(`${stagePrefix}_output_parsed_json`, { requestId, modelId, parsed });
  if (!isModelRecommendationPayload(parsed)) {
    logModelPipeline("request_failure", {
      requestId,
      modelId,
      reason: `${stagePrefix}_parse_invalid_payload`,
      textLength: text.length,
      text,
      parsed,
    });
    throw new Error(
      `Local model returned unparsable recommendation text: ${text.slice(0, 240)}`,
    );
  }
  return parsed;
}

async function generateTextIntent(
  model: LlamaLanguageModel,
  prompt: string,
  request: LocalRecommendationRequest,
  modelId: string,
  requestId: string,
  structuredError: unknown,
  abortSignal?: AbortSignal,
  stagePrefix = "intent_fallback",
) {
  if (stagePrefix === "intent_fallback") {
    console.info(
      "Structured local-intent parsing failed; using tolerant JSON extraction fallback.",
      structuredError,
    );
  }
  const fallbackPrompt = `${prompt}\n\nReturn only one JSON object and nothing else.`;
  logModelPipeline(`${stagePrefix}_input`, {
    requestId,
    modelId,
    triggerReason: structuredError,
    promptLength: fallbackPrompt.length,
    prompt: fallbackPrompt,
  });
  const { text } = await withGenerationTimeout(
    requestId,
    modelId,
    "intent_fallback_generation",
    abortSignal,
    (signal) =>
      generateText({
        model,
        prompt: fallbackPrompt,
        temperature: 0.05,
        maxOutputTokens: 80,
        abortSignal: signal,
      }),
  );
  logModelPipeline(`${stagePrefix}_output_raw_text`, {
    requestId,
    modelId,
    textLength: text.length,
    text,
  });

  const parsed = extractJsonObjectFromText(text);
  logModelPipeline(`${stagePrefix}_output_parsed_json`, { requestId, modelId, parsed });
  if (!isModelIntentPayload(parsed)) {
    return { userIntent: buildFallbackIntentFromContext(request) };
  }
  return parsed;
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
  try {
    const model = await loadModelWithParams(modelPath, getPrimaryContextParams());
    preparedModel = model;
    preparedModelId = modelId;
    return model;
  } catch (firstError) {
    console.warn(
      `Local model primary load failed for "${modelId}". Retrying with repaired download and safer params.`,
      firstError,
    );
    await removeModel(modelId).catch(() => {
      // Ignore failures; best effort cleanup before redownload.
    });
    const repairedPath = await ensureModelPath(modelId);
    try {
      const model = await loadModelWithParams(repairedPath, getFallbackContextParams());
      preparedModel = model;
      preparedModelId = modelId;
      return model;
    } catch (secondError) {
      throw new Error(
        `Failed to load model "${modelId}" on device. Primary and fallback loads failed. ${
          secondError instanceof Error ? secondError.message : String(secondError)
        }`,
      );
    }
  }
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

function createPipelineRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function withGenerationTimeout<T>(
  requestId: string,
  modelId: string,
  stage: string,
  parentSignal: AbortSignal | undefined,
  operation: (signal: AbortSignal) => Promise<T>,
) {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      logModelPipeline("request_failure", {
        requestId,
        modelId,
        reason: `${stage}_timeout`,
        timeoutMs: MODEL_GENERATION_TIMEOUT_MS,
      });
      controller.abort();
      reject(new Error(`Local model ${stage} timed out`));
    }, MODEL_GENERATION_TIMEOUT_MS);
  });

  if (parentSignal?.aborted) {
    controller.abort();
  } else {
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  }

  try {
    return await Promise.race([operation(controller.signal), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"))
  );
}

function logModelPipeline(stage: string, payload: Record<string, unknown>) {
  const formattedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, toLogPreview(value)]),
  );
  console.info(`[Local model pipeline] ${stage}`, formattedPayload);
}

function toLogPreview(value: unknown) {
  if (typeof value === "string") {
    if (ENABLE_FULL_PIPELINE_LOGS) {
      return value;
    }
    return value.length > PIPELINE_LOG_PREVIEW_CHARS
      ? `${value.slice(0, PIPELINE_LOG_PREVIEW_CHARS)}…`
      : value;
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      return String(value);
    }
    if (ENABLE_FULL_PIPELINE_LOGS) {
      return serialized;
    }
    return serialized.length > PIPELINE_LOG_PREVIEW_CHARS
      ? `${serialized.slice(0, PIPELINE_LOG_PREVIEW_CHARS)}…`
      : serialized;
  } catch {
    return String(value);
  }
}

function extractJsonObjectFromText(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }
  try {
    return JSON.parse(jsonMatch[0]) as unknown;
  } catch {
    return null;
  }
}

function isModelRecommendationPayload(value: unknown): value is ModelRecommendationPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "merchantId" in value &&
    typeof (value as { merchantId: unknown }).merchantId === "string"
  );
}

function isModelIntentPayload(value: unknown): value is ModelIntentPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "userIntent" in value &&
    typeof (value as { userIntent: unknown }).userIntent === "string"
  );
}

async function loadModelWithParams(
  modelPath: string,
  contextParams: { n_ctx: number; n_gpu_layers: number },
) {
  const model = llama.languageModel(modelPath, { contextParams });
  await model.prepare();
  return model;
}

function getPrimaryContextParams() {
  if (Platform.OS === "ios") {
    return { n_ctx: 1536, n_gpu_layers: 40 };
  }
  return { n_ctx: 1536, n_gpu_layers: 20 };
}

function getFallbackContextParams() {
  return { n_ctx: 1024, n_gpu_layers: 0 };
}

function normalizeModelResponse(
  parsed: ModelRecommendationPayload,
  userIntent: string,
  request: LocalRecommendationRequest,
  modelId: string,
): LocalRecommendationResponse {
  const knownMerchantIds = new Set(request.merchants.map((merchant) => merchant.id));

  if (!knownMerchantIds.has(parsed.merchantId)) {
    throw new Error(`Local model recommended unknown merchant ${parsed.merchantId}`);
  }

  return {
    merchantId: parsed.merchantId,
    userIntent,
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

function normalizeIntent(intent: unknown, request: LocalRecommendationRequest) {
  if (typeof intent !== "string") {
    return buildFallbackIntentFromContext(request);
  }
  const normalized = intent
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (normalized.length === 0) {
    return buildFallbackIntentFromContext(request);
  }
  return normalized.slice(0, 64);
}

function buildFallbackIntentFromContext(request: LocalRecommendationRequest) {
  const firstIntent = request.context.intentLabels[0] ?? "browsing";
  const firstDemand = request.context.demandTags[0] ?? "local_discovery";
  return `${firstIntent}_${firstDemand}`.replaceAll("-", "_");
}
