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

import { getMerchants } from "@/src/lib/api";
import type {
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

      if (!isMountedRef.current) return;

      setMerchants(nextMerchants);
      setRecommendation(nextRecommendation);
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
      lastUpdatedAt,
      error,
      refreshNow,
    }),
    [
      status,
      context,
      merchants,
      recommendation,
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

