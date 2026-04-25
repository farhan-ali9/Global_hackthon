import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { generateCoupon, getMerchants } from "@/src/lib/api";
import type {
  GeneratedCouponResponse,
  LocalRecommendationResponse,
  MerchantSummary,
  UserContext,
} from "@/src/types/city-wallet";

import { deviceContextProvider } from "./ContextProvider";
import { recommendMerchant } from "./LocalMerchantRecommender";

const REFRESH_INTERVAL_MS = 10_000;

type UserContextLoopStatus = "idle" | "refreshing" | "ready" | "error";

type UserContextLoopState = {
  status: UserContextLoopStatus;
  context: UserContext | null;
  merchants: MerchantSummary[];
  recommendation: LocalRecommendationResponse | null;
  coupon: GeneratedCouponResponse | null;
  lastUpdatedAt: string | null;
  error: string | null;
  refreshNow: () => Promise<void>;
};

const UserContextLoopContext = createContext<UserContextLoopState | null>(null);

export function UserContextLoopProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<UserContextLoopStatus>("idle");
  const [context, setContext] = useState<UserContext | null>(null);
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [recommendation, setRecommendation] =
    useState<LocalRecommendationResponse | null>(null);
  const [coupon, setCoupon] = useState<GeneratedCouponResponse | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);
  const isMountedRef = useRef(false);

  const refreshNow = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setStatus("refreshing");
    setError(null);

    try {
      const nextContext = await deviceContextProvider.getUserContext();
      if (isMountedRef.current) {
        setContext(nextContext);
      }

      const nextMerchants = await getMerchants(nextContext.cityId);
      const nextRecommendation = await recommendMerchant({
        context: nextContext,
        merchants: nextMerchants,
      });
      const nextCoupon = await generateCoupon({
        merchantId: nextRecommendation.merchantId,
        context: buildBackendCouponContext(nextContext, nextRecommendation),
      });

      if (!isMountedRef.current) return;

      setMerchants(nextMerchants);
      setRecommendation(nextRecommendation);
      setCoupon(nextCoupon);
      setLastUpdatedAt(new Date().toISOString());
      setStatus("ready");
    } catch (refreshError) {
      if (!isMountedRef.current) return;

      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Context refresh failed",
      );
      setStatus("error");
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshNow();

    const intervalId = setInterval(() => {
      void refreshNow();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [refreshNow]);

  const value = useMemo<UserContextLoopState>(
    () => ({
      status,
      context,
      merchants,
      recommendation,
      coupon,
      lastUpdatedAt,
      error,
      refreshNow,
    }),
    [
      status,
      context,
      merchants,
      recommendation,
      coupon,
      lastUpdatedAt,
      error,
      refreshNow,
    ],
  );

  return (
    <UserContextLoopContext.Provider value={value}>
      {children}
    </UserContextLoopContext.Provider>
  );
}

export function useUserContextLoop() {
  const value = useContext(UserContextLoopContext);
  if (value === null) {
    throw new Error("useUserContextLoop must be used inside UserContextLoopProvider");
  }

  return value;
}

function buildBackendCouponContext(
  context: UserContext,
  recommendation: LocalRecommendationResponse,
) {
  return {
    cityId: context.cityId,
    zoneId: context.zoneId,
    currentTimeIso: context.currentTimeIso,
    timezone: context.timezone,
    dayOfWeek: context.dayOfWeek,
    isWeekend: context.isWeekend,
    timeOfDay: context.timeOfDay,
    weatherBucket: context.weatherBucket,
    weather: context.weather,
    intentLabels: context.intentLabels,
    eventTags: context.eventTags,
    demandTags: context.demandTags,
    mobilityState: context.mobilityState,
    localRecommendation: {
      confidence: recommendation.confidence,
      reasoningTags: recommendation.reasoningTags,
    },
  };
}
