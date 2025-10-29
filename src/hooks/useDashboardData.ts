// ============================================================================
// useDashboardData Hook
// ============================================================================
// Fetches and manages dashboard data: sections, progress, last session

import { useState, useEffect, useCallback } from "react";
import {
  fetchSections,
  fetchUserProgress,
  fetchSessionDetails,
  isValidUuid,
  type ApiClientError,
} from "@/lib/api/dashboard.client";
import {
  mapSectionsAndProgressToDashboardVM,
  mapSessionToLastSessionVM,
  findRecommendedTopic,
  type DashboardState,
  type DashboardDataVM,
} from "@/lib/types/dashboard-view.types";

const LAST_SESSION_STORAGE_KEY = "lastSessionId";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Custom hook for fetching and managing dashboard data
 * Combines sections, user progress, and last session validation
 */
export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: undefined,
    data: undefined,
    isEmpty: false,
  });
  const [retryCount, setRetryCount] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // 1. Fetch sections and user progress in parallel
      const [sectionsResponse, progressResponse] = await Promise.all([fetchSections(), fetchUserProgress()]);

      // 2. Map sections and progress to view models
      const sections = mapSectionsAndProgressToDashboardVM(sectionsResponse.sections, progressResponse.progress);

      // 3. Find recommended topic based on progress
      const recommended = findRecommendedTopic(progressResponse.progress);

      // 4. Validate last session from localStorage
      let lastSession = undefined;
      const lastSessionId = localStorage.getItem(LAST_SESSION_STORAGE_KEY);

      if (lastSessionId && isValidUuid(lastSessionId)) {
        try {
          const sessionDetails = await fetchSessionDetails(lastSessionId);
          lastSession = mapSessionToLastSessionVM(sessionDetails);
        } catch (error) {
          // If session validation fails (404, 403, etc.), just ignore it
          // Don't block the whole dashboard
          console.warn("Failed to validate last session:", error);
          // Optionally clear invalid session from localStorage
          localStorage.removeItem(LAST_SESSION_STORAGE_KEY);
        }
      }

      // 5. Build complete dashboard data
      const dashboardData: DashboardDataVM = {
        sections,
        lastSession,
        recommended,
      };

      setState({
        loading: false,
        error: undefined,
        data: dashboardData,
        isEmpty: sections.length === 0,
      });

      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      const apiError = error as ApiClientError;

      setState({
        loading: false,
        error: {
          code: apiError.code || "UNKNOWN_ERROR",
          message: apiError.message || "Nie udało się załadować danych",
        },
        data: undefined,
        isEmpty: false,
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refetch = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      console.error("Max retry attempts reached");
      return;
    }

    setRetryCount((prev) => prev + 1);

    // Simple delay before retry
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await loadDashboardData();
  }, [loadDashboardData, retryCount]);

  return {
    ...state,
    refetch,
    canRetry: retryCount < MAX_RETRY_ATTEMPTS,
  };
}
