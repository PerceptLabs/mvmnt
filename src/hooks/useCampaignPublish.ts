/**
 * useCampaignPublish Hook
 * 
 * Custom hook for publishing campaigns and action attestations to Nostr
 */

import { useCallback } from 'react';
import { useNostrPublish } from './useNostrPublish';
import {
  CAMPAIGN_KIND,
  CAMPAIGN_UPDATE_KIND,
  ACTION_ATTESTATION_KIND,
  generateNonce,
  type CampaignCategory,
  type TargetLevel,
  type CampaignStatus,
} from '@/types/nostr';

/**
 * Campaign creation parameters
 */
export interface CreateCampaignParams {
  title: string;
  pitch: string;
  description: string;
  category: CampaignCategory;
  targetLevels: TargetLevel[];
}

/**
 * Campaign update parameters
 */
export interface UpdateCampaignParams {
  campaignDTag: string;
  status?: CampaignStatus;
  message?: string;
}

/**
 * Action attestation parameters
 */
export interface CreateActionParams {
  campaignEventId: string;
  campaignDTag: string;
  repCount?: number;
  message?: string;
}

/**
 * Hook for publishing campaigns and related events
 */
export function useCampaignPublish() {
  const { mutate: publishEvent, isPending, isError, error } = useNostrPublish();

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(
    (params: CreateCampaignParams, onSuccess?: (eventId: string) => void) => {
      // Generate unique campaign ID
      const campaignId = params.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-6);

      const tags = [
        ['d', campaignId],
        ['title', params.title],
        ['category', params.category],
        ...params.targetLevels.map((level) => ['target_level', level] as const),
        ['created_at', Math.floor(Date.now() / 1000)],
        ['status', 'active'],
        ['alt', `Campaign: ${params.title}`],
      ];

      publishEvent(
        {
          kind: CAMPAIGN_KIND,
          content: params.description,
          tags,
        },
        {
          onSuccess: (event) => {
            onSuccess?.(event.id);
          },
        }
      );

      return campaignId;
    },
    [publishEvent]
  );

  /**
   * Update an existing campaign
   */
  const updateCampaign = useCallback(
    (params: UpdateCampaignParams, onSuccess?: (eventId: string) => void) => {
      const tags: string[][] = [
        ['d', params.campaignDTag],
        ['alt', `Campaign Update`],
      ];

      if (params.status) {
        tags.push(['status', params.status]);
      }

      if (params.message) {
        tags.push(['updated_at', Math.floor(Date.now() / 1000).toString()]);
      }

      publishEvent(
        {
          kind: CAMPAIGN_UPDATE_KIND,
          content: params.message || '',
          tags,
        },
        {
          onSuccess: (event) => {
            onSuccess?.(event.id);
          },
        }
      );
    },
    [publishEvent]
  );

  /**
   * Create an action attestation
   */
  const createActionAttestation = useCallback(
    (params: CreateActionParams, onSuccess?: (eventId: string) => void) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = generateNonce();

      const tags = [
        ['e', params.campaignEventId],
        ['d', params.campaignDTag],
        ['timestamp', timestamp],
        ['nonce', nonce],
        ['alt', 'Action Attestation'],
      ];

      if (params.repCount) {
        tags.push(['rep_count', params.repCount.toString()]);
      }

      publishEvent(
        {
          kind: ACTION_ATTESTATION_KIND,
          content: params.message || 'I took action on this campaign',
          tags,
        },
        {
          onSuccess: (event) => {
            onSuccess?.(event.id);
          },
        }
      );
    },
    [publishEvent]
  );

  /**
   * Create a comment on a campaign
   */
  const createComment = useCallback(
    (campaignEventId: string, content: string, onSuccess?: (eventId: string) => void) => {
      publishEvent(
        {
          kind: 1,
          content,
          tags: [
            ['e', campaignEventId],
            ['alt', 'Comment on campaign'],
          ],
        },
        {
          onSuccess: (event) => {
            onSuccess?.(event.id);
          },
        }
      );
    },
    [publishEvent]
  );

  /**
   * Create a reaction to a campaign
   */
  const createReaction = useCallback(
    (campaignEventId: string, emoji: string, onSuccess?: () => void) => {
      publishEvent(
        {
          kind: 7,
          content: emoji,
          tags: [
            ['e', campaignEventId],
            ['alt', `Reaction: ${emoji}`],
          ],
        },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    },
    [publishEvent]
  );

  /**
   * Repost a campaign
   */
  const repostCampaign = useCallback(
    (campaignEventId: string, onSuccess?: () => void) => {
      publishEvent(
        {
          kind: 6,
          content: '',
          tags: [
            ['e', campaignEventId],
            ['k', CAMPAIGN_KIND.toString()],
            ['alt', 'Reposted campaign'],
          ],
        },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    },
    [publishEvent]
  );

  return {
    createCampaign,
    updateCampaign,
    createActionAttestation,
    createComment,
    createReaction,
    repostCampaign,
    isPending,
    isError,
    error,
  };
}
