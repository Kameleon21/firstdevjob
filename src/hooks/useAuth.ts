"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

export function useAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const ensureProfile = useMutation(api.users.ensureProfile);
  const hasEnsuredProfile = useRef(false);

  // Ensure profile exists when user authenticates
  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasEnsuredProfile.current) {
      hasEnsuredProfile.current = true;
      ensureProfile().catch((error) => {
        // Reset flag if it fails so it can retry
        hasEnsuredProfile.current = false;
        console.error("Failed to ensure profile:", error);
      });
    }
  }, [isAuthenticated, isLoading, ensureProfile]);

  // Reset flag when user signs out
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      hasEnsuredProfile.current = false;
    }
  }, [isAuthenticated, isLoading]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || user === undefined,
  };
}
