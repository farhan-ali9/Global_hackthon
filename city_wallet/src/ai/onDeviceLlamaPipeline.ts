import { generateObject } from "ai";
import { Platform } from "react-native";
import type { z } from "zod";

import {
  localRecommendationSchema,
  merchantRankingDecisionSchema,
  offerIntentSchema,
} from "@/src/ai/schemas";
import type {
  LocalRecommendationRequest,
  LocalRecommendationResponse,
  MerchantCandidate,
  OfferIntent,
  SelectedOfferRequest,
  UserContext,
} from "@/src/types/city-wallet";

type LlamaModule = typeof import("@react-native-ai/llama");
type LlamaLanguageModel = InstanceType<LlamaModule["LlamaLanguageModel"]>;
type DownloadProgress = import("@react-native-ai/llama").DownloadProgress;
type MerchantRankingDecision = z.infer<typeof merchantRankingDecisionSchema>;

export type LocalSignalSnapshot =
  | UserContext
  | {
      cityId: string;
      zoneId?: string;
      localSignalSummary?: string;
      capturedAt?: string;
    };

export const DEFAULT_ON_DEVICE_MODEL_ID =
  process.env.EXPO_PUBLIC_ON_DEVICE_MODEL_ID ??
  "Qwen/Qwen2.5-1.5B-Instruct-GGUF/qwen2.5-1.5b-instruct-q4_k_m.gguf";

export type OnDeviceModelStatus = {
  modelId: string;
  modelPath: string | null;
  isDownloaded: boolean;
  isPrepared: boolean;
  downloadProgress: number | null;
  error: string | null;
};

export type LocalRankingPipelineResult = {
  intent: OfferIntent;
  selectedOfferRequest: SelectedOfferRequest;
  decision: MerchantRankingDecision;
};

export class OnDeviceModelUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnDeviceModelUnavailableError";
  }
}

class OnDeviceLlamaModelManager {
  private languageModel: LlamaLanguageModel | null = null;
  private modelPath: string | null = null;
  private downloadProgress: number | null = null;
  private error: string | null = null;

  constructor(private readonly modelId = DEFAULT_ON_DEVICE_MODEL_ID) {}

  get modelStatus(): OnDeviceModelStatus {
    return {
      modelId: this.modelId,
      modelPath: this.modelPath,
      isDownloaded: this.modelPath !== null,
      isPrepared: this.languageModel !== null,
      downloadProgress: this.downloadProgress,
      error: this.error,
    };
  }

  async refreshStatus(): Promise<OnDeviceModelStatus> {
    try {
      const llamaModule = await loadLlamaModule();
      const isDownloaded = await llamaModule.isModelDownloaded(this.modelId);

      this.modelPath = isDownloaded ? llamaModule.getModelPath(this.modelId) : null;
      this.error = null;
    } catch (error) {
      this.error = toErrorMessage(error);
    }

    return this.modelStatus;
  }

  async downloadModel(
    onProgress?: (status: OnDeviceModelStatus) => void,
  ): Promise<OnDeviceModelStatus> {
    try {
      const llamaModule = await loadLlamaModule();
      this.downloadProgress = 0;
      this.error = null;

      this.modelPath = await llamaModule.downloadModel(
        this.modelId,
        (progress: DownloadProgress) => {
          this.downloadProgress = progress.percentage;
          onProgress?.(this.modelStatus);
        },
      );

      this.downloadProgress = 100;
    } catch (error) {
      this.error = toErrorMessage(error);
    }

    return this.modelStatus;
  }

  async prepareModel(): Promise<OnDeviceModelStatus> {
    try {
      const llamaModule = await loadLlamaModule();
      const isDownloaded = await llamaModule.isModelDownloaded(this.modelId);

      if (!isDownloaded) {
        throw new OnDeviceModelUnavailableError(
          "Download the on-device model before preparing it.",
        );
      }

      this.modelPath = llamaModule.getModelPath(this.modelId);
      this.languageModel = llamaModule.llama.languageModel(this.modelPath, {
        contextParams: {
          n_ctx: 2048,
          n_gpu_layers: 99,
        },
      });
      await this.languageModel.prepare();
      this.error = null;
    } catch (error) {
      this.languageModel = null;
      this.error = toErrorMessage(error);
    }

    return this.modelStatus;
  }

  async unloadModel(): Promise<OnDeviceModelStatus> {
    try {
      await this.languageModel?.unload();
      this.languageModel = null;
      this.error = null;
    } catch (error) {
      this.error = toErrorMessage(error);
    }

    return this.modelStatus;
  }

  async deriveOfferIntent(localSignals: LocalSignalSnapshot): Promise<OfferIntent> {
    const model = this.requirePreparedModel();
    const { object } = await generateObject({
      model,
      schema: offerIntentSchema,
      schemaName: "OfferIntent",
      schemaDescription:
        "Coarse, privacy-preserving intent for City Wallet offer generation.",
      temperature: 0,
      maxOutputTokens: 300,
      experimental_repairText: repairJsonObjectOutput,
      system:
        "Return only valid JSON. Do not use markdown. You are a privacy filter running on-device. Convert private local signals into the coarse City Wallet offer intent schema. Do not include exact location, raw movement traces, full preferences, or profile details.",
      prompt: buildIntentPrompt(localSignals),
    });

    return object;
  }

  async rankMerchantCandidates({
    localSignals,
    candidates,
  }: {
    localSignals: LocalSignalSnapshot;
    candidates: MerchantCandidate[];
  }): Promise<LocalRankingPipelineResult> {
    if (candidates.length === 0) {
      throw new Error("Load merchant candidates before running local ranking.");
    }

    const model = this.requirePreparedModel();
    const intent = await this.deriveOfferIntent(localSignals);
    const { object: decision } = await generateObject({
      model,
      schema: merchantRankingDecisionSchema,
      schemaName: "MerchantRankingDecision",
      schemaDescription:
        "Local merchant ranking decision. selectedMerchantId must be one of the provided candidate ids.",
      temperature: 0,
      maxOutputTokens: 500,
      experimental_repairText: repairJsonObjectOutput,
      system:
        "Return only valid JSON. Do not use markdown. You rank merchant candidates on-device using private user context. Select exactly one merchant id from the provided candidates and keep private details out of the output.",
      prompt: buildRankingPrompt(localSignals, intent, candidates),
    });

    assertKnownCandidate(decision.selectedMerchantId, candidates);

    return {
      intent,
      decision,
      selectedOfferRequest: {
        merchantId: decision.selectedMerchantId,
        intent,
      },
    };
  }

  async recommendMerchant(
    request: LocalRecommendationRequest,
  ): Promise<LocalRecommendationResponse> {
    if (request.merchants.length === 0) {
      throw new Error("Cannot recommend a merchant from an empty merchant list");
    }

    const model = this.requirePreparedModel();
    const { object } = await generateObject({
      model,
      schema: localRecommendationSchema,
      schemaName: "LocalRecommendationResponse",
      schemaDescription:
        "Local merchant recommendation. merchantId must be one of the provided merchant ids.",
      temperature: 0,
      maxOutputTokens: 300,
      experimental_repairText: repairJsonObjectOutput,
      system:
        "Return only valid JSON. Do not use markdown. You recommend a merchant on-device using precise private user context. Do not include coordinates or raw private context in the output.",
      prompt: buildLocalRecommendationPrompt(request),
    });

    assertKnownMerchantSummary(object.merchantId, request.merchants);

    return object;
  }

  private requirePreparedModel(): LlamaLanguageModel {
    if (!this.languageModel) {
      throw new OnDeviceModelUnavailableError(
        "Prepare the on-device model before running local AI.",
      );
    }

    return this.languageModel;
  }
}

const manager = new OnDeviceLlamaModelManager();

export function getOnDeviceLlamaModelManager() {
  return manager;
}

async function loadLlamaModule(): Promise<LlamaModule> {
  if (Platform.OS === "web") {
    throw new OnDeviceModelUnavailableError(
      "On-device Llama requires an iOS or Android custom Expo dev build.",
    );
  }

  try {
    return await import("@react-native-ai/llama");
  } catch (error) {
    throw new OnDeviceModelUnavailableError(
      `Could not load the Llama native module. Rebuild the Expo dev client after installing native dependencies. ${toErrorMessage(error)}`,
    );
  }
}

function buildIntentPrompt(localSignals: LocalSignalSnapshot) {
  return [
    `Required cityId: ${localSignals.cityId}`,
    `Private local zone, if available: ${localSignals.zoneId ?? "not provided"}`,
    `Captured at: ${getCapturedAt(localSignals)}`,
    "Private local signal summary:",
    getLocalSignalSummary(localSignals),
    "Allowed intentLabels: browsing, hungry, seeking_warmth, commuting, social.",
    "Allowed weatherBucket: clear, cloudy, rain, cold, hot.",
    "Allowed timeOfDay: morning, lunch, afternoon, evening.",
    "Return JSON with exactly these keys: cityId, timeOfDay, weatherBucket, intentLabels, eventTags, demandTags.",
    'Example: {"cityId":"linz-demo","timeOfDay":"lunch","weatherBucket":"cold","intentLabels":["browsing","seeking_warmth"],"eventTags":[],"demandTags":["quiet"]}',
  ].join("\n");
}

function buildRankingPrompt(
  localSignals: LocalSignalSnapshot,
  intent: OfferIntent,
  candidates: MerchantCandidate[],
) {
  return [
    "Coarse offer intent:",
    JSON.stringify(intent, null, 2),
    "Private local ranking hints, used only on-device:",
    JSON.stringify(
      {
        zoneId: localSignals.zoneId,
        localSignalSummary: getLocalSignalSummary(localSignals),
      },
      null,
      2,
    ),
    "Merchant candidates:",
    JSON.stringify(candidates, null, 2),
    "Return the selected merchant id and a compact ranking. The selectedMerchantId must be one of the candidate ids.",
    'Return JSON with exactly these keys: selectedMerchantId, rationale, ranking. Example: {"selectedMerchantId":"merchant-cafe-mueller","rationale":"Closest warm quiet cafe for lunch.","ranking":[{"merchantId":"merchant-cafe-mueller","score":95,"reasons":["near old-town","quiet demand","warm cafe fit"]}]}',
  ].join("\n\n");
}

function buildLocalRecommendationPrompt(request: LocalRecommendationRequest) {
  return [
    "Pick the best merchant for this user context.",
    "Return JSON with exactly these keys: merchantId, confidence, reasoningTags.",
    'Example: {"merchantId":"merchant-cafe-mueller","confidence":0.82,"reasoningTags":["nearby","lunch","weather_fit"]}',
    "",
    "Private user context, available only on-device:",
    JSON.stringify(request.context, null, 2),
    "",
    "Merchant summaries:",
    JSON.stringify(request.merchants, null, 2),
  ].join("\n");
}

function assertKnownCandidate(
  selectedMerchantId: string,
  candidates: MerchantCandidate[],
) {
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));

  if (!candidateIds.has(selectedMerchantId)) {
    throw new Error("Model selected a merchant outside the candidate set.");
  }
}

function assertKnownMerchantSummary(
  merchantId: string,
  merchants: LocalRecommendationRequest["merchants"],
) {
  if (!merchants.some((merchant) => merchant.id === merchantId)) {
    throw new Error("Model selected a merchant outside the merchant set.");
  }
}

function getCapturedAt(localSignals: LocalSignalSnapshot) {
  if ("currentTimeIso" in localSignals) return localSignals.currentTimeIso;
  return localSignals.capturedAt ?? new Date().toISOString();
}

function getLocalSignalSummary(localSignals: LocalSignalSnapshot) {
  if (
    "localSignalSummary" in localSignals &&
    typeof localSignals.localSignalSummary === "string" &&
    localSignals.localSignalSummary.trim()
  ) {
    return localSignals.localSignalSummary;
  }

  if ("currentTimeIso" in localSignals) {
    return JSON.stringify(
      {
        zoneId: localSignals.zoneId,
        coordinates: localSignals.coordinates,
        coordinateAccuracyMeters: localSignals.coordinateAccuracyMeters,
        currentTimeIso: localSignals.currentTimeIso,
        timezone: localSignals.timezone,
        locale: localSignals.locale,
        dayOfWeek: localSignals.dayOfWeek,
        isWeekend: localSignals.isWeekend,
        timeOfDay: localSignals.timeOfDay,
        weather: localSignals.weather,
        intentLabels: localSignals.intentLabels,
        eventTags: localSignals.eventTags,
        demandTags: localSignals.demandTags,
        mobilityState: localSignals.mobilityState,
      },
      null,
      2,
    );
  }

  return "No private signal summary provided.";
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function repairJsonObjectOutput({ text }: { text: string }) {
  const fencedJsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedJsonMatch?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
}
