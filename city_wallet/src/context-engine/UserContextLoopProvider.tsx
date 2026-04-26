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

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { generateCoupon, getMerchants } from "@/src/lib/api";
import type {
  GeneratedCouponResponse,
  LocalRecommendationResponse,
  MerchantSummary,
  UserContext,
} from "@/src/types/city-wallet";

import { buildCouponRequestContext, deviceContextProvider } from "./ContextProvider";
import { recommendMerchant } from "./LocalMerchantRecommender";

const REFRESH_INTERVAL_MS = 10_000;

type UserContextLoopStatus = "idle" | "refreshing" | "ready" | "error";

type UserContextLoopState = {
  status: UserContextLoopStatus;
  context: UserContext | null;
  merchants: MerchantSummary[];
  recommendation: LocalRecommendationResponse | null;
  coupon: GeneratedCouponResponse | null;
  couponError: string | null;
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
  const [couponError, setCouponError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);
  const isMountedRef = useRef(false);
  // Track the last coupon we notified about to avoid re-firing on every cached hit
  const lastNotifiedCouponKeyRef = useRef<string | null>(null);

  const refreshNow = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setStatus("refreshing");
    setError(null);
    setCouponError(null);

    try {
      let nextContext: UserContext;
      try {
        nextContext = await deviceContextProvider.getUserContext();
      } catch (error) {
        throw new Error(withCause("Failed to build user context", error));
      }
      if (isMountedRef.current) {
        setContext(nextContext);
      }

      let nextMerchants: MerchantSummary[];
      try {
        nextMerchants = await getMerchants(nextContext.cityId);
      } catch (error) {
        throw new Error(
          withCause(
            `Failed to fetch merchants for city "${nextContext.cityId}"`,
            error,
          ),
        );
      }

      let nextRecommendation: LocalRecommendationResponse;
      try {
        nextRecommendation = await recommendMerchant({
          context: nextContext,
          merchants: nextMerchants,
        });
      } catch (error) {
        throw new Error(withCause("Failed to recommend merchant", error));
      }

      let nextCoupon: GeneratedCouponResponse | null = null;
      let nextCouponError: string | null = null;
      try {
        nextCoupon = await generateCoupon({
          merchantId: nextRecommendation.merchantId,
          userIntent: nextRecommendation.userIntent,
          context: buildCouponRequestContext(nextContext),
        });
      } catch (couponGenerationError) {
        nextCouponError = withCause("Failed to generate coupon", couponGenerationError);
      }

      if (!isMountedRef.current) return;

      setMerchants(nextMerchants);
      setRecommendation(nextRecommendation);
      setCoupon(nextCoupon);
      setCouponError(nextCouponError);

      // Fire a local notification only when a genuinely new coupon arrives
      // (different merchant or different expiry = new generation, not a cache hit)
      if (nextCoupon) {
        const couponKey = `${nextCoupon.merchantId}::${nextCoupon.expiresAt}`;
        if (couponKey !== lastNotifiedCouponKeyRef.current) {
          lastNotifiedCouponKeyRef.current = couponKey;
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: nextCoupon.headline,
                body: nextCoupon.body,
                data: { type: "new_coupon", merchantId: nextCoupon.merchantId },
                ...(Platform.OS === "android" && { color: "#2d6a4f", priority: "high" }),
              },
              trigger: null,
            });
          } catch {
            // Non-fatal — notification permission may not be granted yet
          }
        }
      }

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
      couponError,
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
      couponError,
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

function withCause(message: string, error: unknown) {
  if (error instanceof Error && error.message) {
    return `${message}: ${error.message}`;
  }
  return message;
}

export function useUserContextLoop() {
  const value = useContext(UserContextLoopContext);
  if (value === null) {
    throw new Error("useUserContextLoop must be used inside UserContextLoopProvider");
  }

  return value;
}

