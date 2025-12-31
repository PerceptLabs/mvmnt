/**
 * useCampaign Hook
 * 
 * Custom hook for querying campaigns and their metrics
 */

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import {
  CampaignEvent,
  parseCampaign,
  isCampaignEvent,
  isActionAttestationEvent,
  CAMPAIGN_KIND,
  ACTION_ATTESTATION_KIND,
  type Campaign,
  type CampaignMetrics,
} from '@/types/nostr';

/**
 * Fetch a single campaign by its d-tag
 */
export function useCampaign(campaignId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async ({ signal }) => {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query(
        [
          {
            kinds: [CAMPAIGN_KIND],
            '#d': [campaignId],
            limit: 1,
          },
        ],
        { signal: abortSignal }
      );

      const campaignEvent = events.find(isCampaignEvent);
      if (!campaignEvent) {
        throw new Error('Campaign not found');
      }

      return parseCampaign(campaignEvent);
    },
    enabled: !!campaignId,
    staleTime: 60000,
  });
}

/**
 * Fetch multiple campaigns with filtering
 */
export function useCampaigns(options: {
  category?: string;
  targetLevel?: string;
  limit?: number;
}) {
  const { nostr } = useNostr();
  const { category, targetLevel, limit = 50 } = options;

  return useQuery({
    queryKey: ['campaigns', { category, targetLevel, limit }],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);

      const filters: any[] = [
        {
          kinds: [CAMPAIGN_KIND],
          '#status': ['active'],
          limit,
        },
      ];

      // Add category filter if provided
      if (category) {
        filters[0]['#t'] = [category];
      }

      const events = await nostr.query(filters, { signal: abortSignal });
      const campaigns = events.filter(isCampaignEvent).map(parseCampaign);

      return campaigns;
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });
}

/**
 * Fetch campaigns sorted by creation date (newest first)
 */
export function useNewCampaigns(limit = 20) {
  return useCampaigns({ limit });
}

/**
 * Fetch campaigns sorted by action count (trending)
 * Note: This is a placeholder - real implementation would query attestations
 */
export function useTrendingCampaigns(limit = 20) {
  return useCampaigns({ limit });
}

/**
 * Fetch campaigns with recent activity (hot)
 * Note: This is a placeholder - real implementation would query attestations by timestamp
 */
export function useHotCampaigns(limit = 20) {
  return useCampaigns({ limit });
}

/**
 * Fetch campaign metrics (action counts, shares, etc.)
 */
export function useCampaignMetrics(campaignId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async ({ signal }) => {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);

      // Fetch attestations for this campaign
      const attestations = await nostr.query(
        [
          {
            kinds: [ACTION_ATTESTATION_KIND],
            '#d': [campaignId],
            limit: 1000,
          },
        ],
        { signal: abortSignal }
      );

      // Calculate total actions
      const totalActions = attestations.filter(isActionAttestationEvent).length;

      // Calculate hot actions (last 24 hours)
      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 86400;
      const hotActions = attestations.filter((a) => {
        if (!isActionAttestationEvent(a)) return false;
        const timestamp = a.tags.find((t) => t[0] === 'timestamp');
        const ts = timestamp ? parseInt(timestamp[1]) : a.created_at;
        return ts >= oneDayAgo;
      }).length;

      // Placeholder for share count (would query kind 6 reposts)
      const shareCount = 0;

      // Placeholder for reaction count (would query kind 7 reactions)
      const reactionCount = 0;

      // Placeholder for comment count (would query kind 1 comments)
      const commentCount = 0;

      const metrics: CampaignMetrics = {
        totalActions,
        hotActions,
        shareCount,
        reactionCount,
        commentCount,
      };

      return metrics;
    },
    enabled: !!campaignId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Fetch campaigns created by a specific user
 */
export function useUserCampaigns(pubkey: string | undefined, limit = 20) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['user-campaigns', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) {
        return [];
      }

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query(
        [
          {
            kinds: [CAMPAIGN_KIND],
            authors: [pubkey],
            limit,
          },
        ],
        { signal: abortSignal }
      );

      return events.filter(isCampaignEvent).map(parseCampaign);
    },
    enabled: !!pubkey,
    staleTime: 60000,
  });
}

/**
 * Fetch action attestations for a campaign
 */
export function useCampaignAttestations(campaignId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['campaign-attestations', campaignId],
    queryFn: async ({ signal }) => {
      if (!campaignId) {
        return [];
      }

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query(
        [
          {
            kinds: [ACTION_ATTESTATION_KIND],
            '#d': [campaignId],
            limit: 100,
          },
        ],
        { signal: abortSignal }
      );

      return events.filter(isActionAttestationEvent);
    },
    enabled: !!campaignId,
    staleTime: 30000,
  });
}

/**
 * Fetch recent user actions (attestations)
 */
export function useUserActions(pubkey: string | undefined, limit = 20) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['user-actions', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) {
        return [];
      }

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query(
        [
          {
            kinds: [ACTION_ATTESTATION_KIND],
            authors: [pubkey],
            limit,
          },
        ],
        { signal: abortSignal }
      );

      return events.filter(isActionAttestationEvent);
    },
    enabled: !!pubkey,
    staleTime: 30000,
  });
}
