/**
 * useClaimDetail Hook
 * Einzelnen Claim laden mit Caching
 */

import { useState, useCallback, useEffect } from 'react';
import { claimsApi, ClaimDetail } from '../services/api/claims';

interface UseClaimDetailOptions {
  autoFetch?: boolean;
}

interface UseClaimDetailReturn {
  claim: ClaimDetail | null;
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  addComment: (content: string) => Promise<void>;
  submitClaim: () => Promise<void>;
}

export function useClaimDetail(
  claimId: string,
  options: UseClaimDetailOptions = {}
): UseClaimDetailReturn {
  const { autoFetch = true } = options;

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaim = useCallback(async () => {
    if (!claimId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await claimsApi.getById(claimId);
      setClaim(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Laden des Schadens';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [claimId]);

  const addComment = useCallback(
    async (content: string) => {
      if (!claimId) return;

      try {
        await claimsApi.addComment(claimId, content);
        // Claim neu laden um Kommentare zu aktualisieren
        await fetchClaim();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Fehler beim Hinzufügen des Kommentars';
        throw new Error(errorMessage);
      }
    },
    [claimId, fetchClaim]
  );

  const submitClaim = useCallback(async () => {
    if (!claimId) return;

    try {
      const updatedClaim = await claimsApi.submit(claimId);
      setClaim(updatedClaim);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Einreichen des Schadens';
      throw new Error(errorMessage);
    }
  }, [claimId]);

  useEffect(() => {
    if (autoFetch && claimId) {
      fetchClaim();
    }
  }, [autoFetch, claimId, fetchClaim]);

  return {
    claim,
    isLoading,
    error,
    fetch: fetchClaim,
    refresh: fetchClaim,
    addComment,
    submitClaim,
  };
}
