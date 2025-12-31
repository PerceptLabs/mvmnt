/**
 * Nostr Event Types for Movement Platform
 * 
 * Defines custom Nostr event kinds (31100, 31101, 31102) for:
 * - Campaign creation and management
 * - Campaign updates
 * - Action attestations
 */

import type { NostrEvent } from '@nostrify/nostrify';

// ============================================================================
// Campaign Event (Kind 31100)
// ============================================================================

/**
 * Campaign status values
 */
export type CampaignStatus = 'active' | 'completed' | 'archived';

/**
 * Government target levels
 */
export type TargetLevel = 'federal' | 'state' | 'local';

/**
 * Campaign categories
 */
export type CampaignCategory =
  | 'environment'
  | 'healthcare'
  | 'education'
  | 'civil_rights'
  | 'economy'
  | 'immigration'
  | 'gun_control'
  | 'housing'
  | 'transportation'
  | 'technology'
  | 'criminal_justice'
  | 'election_reform'
  | 'government_transparency'
  | 'public_safety'
  | 'community';

/**
 * Campaign event kind constant
 */
export const CAMPAIGN_KIND = 31100;

/**
 * Campaign Nostr event interface
 * 
 * @remarks
 * This event represents a civic engagement campaign with metadata about
 * the issue, target government levels, and call-to-action.
 */
export interface CampaignEvent extends NostrEvent {
  kind: typeof CAMPAIGN_KIND;
  tags: CampaignTags;
}

/**
 * Tags for campaign events
 */
export interface CampaignTags extends Array<CampaignTag> {
  // Required tags
  [0]: ['d', string]; // Campaign unique identifier
  [1]: ['title', string]; // Campaign title
  [2]: ['category', CampaignCategory]; // Issue category (may have multiple)
  [3]: ['target_level', TargetLevel]; // Government level (may have multiple)
  // More categories and target_levels can follow
  [number]: CampaignTag;
}

/**
 * Individual tag type for campaigns
 */
export type CampaignTag =
  | ['d', string] // Required: Campaign ID
  | ['title', string] // Required: Campaign title
  | ['category', CampaignCategory] // Required: Issue category
  | ['target_level', TargetLevel] // Required: Government level
  | ['created_at', number] // Optional: Campaign creation timestamp
  | ['status', CampaignStatus] // Optional: Campaign status (default: active)
  | ['alt', string] // Required: NIP-31 human-readable description
  | ['image', string] // Optional: Campaign banner image
  | ['video', string] // Optional: Campaign video
  | ['link', string] // Optional: Related links
  | string[]; // Other custom tags

// ============================================================================
// Campaign Update Event (Kind 31101)
// ============================================================================

/**
 * Campaign update event kind constant
 */
export const CAMPAIGN_UPDATE_KIND = 31101;

/**
 * Campaign update Nostr event interface
 * 
 * @remarks
 * This event represents updates to a campaign (status changes, milestones, etc.)
 */
export interface CampaignUpdateEvent extends NostrEvent {
  kind: typeof CAMPAIGN_UPDATE_KIND;
  tags: CampaignUpdateTags;
}

/**
 * Tags for campaign update events
 */
export interface CampaignUpdateTags extends Array<CampaignUpdateTag> {
  // Required tags
  [0]: ['d', string]; // Must match parent campaign's d-tag
  // Optional tags
  [number]: CampaignUpdateTag;
}

/**
 * Individual tag type for campaign updates
 */
export type CampaignUpdateTag =
  | ['d', string] // Required: Campaign ID (matches parent)
  | ['status', CampaignStatus] // Optional: New status
  | ['updated_at', number] // Optional: Update timestamp
  | ['alt', string] // Required: NIP-31 description
  | ['milestone', string] // Optional: Milestone description
  | string[]; // Other custom tags

// ============================================================================
// Action Attestation Event (Kind 31102)
// ============================================================================

/**
 * Action attestation event kind constant
 */
export const ACTION_ATTESTATION_KIND = 31102;

/**
 * Action attestation Nostr event interface
 * 
 * @remarks
 * This event proves that a user took action on a campaign.
 * CRITICAL: Never include sensitive information (addresses, ZIP codes,
 * representative names, message content) in these events.
 */
export interface ActionAttestationEvent extends NostrEvent {
  kind: typeof ACTION_ATTESTATION_KIND;
  tags: ActionAttestationTags;
}

/**
 * Tags for action attestation events
 */
export interface ActionAttestationTags extends Array<ActionAttestationTag> {
  // Required tags
  [0]: ['e', string]; // Parent campaign event ID
  [1]: ['d', string]; // Campaign d-tag (for filtering)
  [2]: ['timestamp', number]; // Action timestamp (for replay prevention)
  [3]: ['nonce', string]; // Random nonce (for replay prevention)
  // Optional tags
  [number]: ActionAttestationTag;
}

/**
 * Individual tag type for action attestations
 */
export type ActionAttestationTag =
  | ['e', string] // Required: Parent campaign event ID
  | ['d', string] // Required: Campaign d-tag
  | ['timestamp', number] // Required: Action timestamp
  | ['nonce', string] // Required: Random nonce
  | ['rep_count', number] // Optional: Number of representatives contacted
  | ['alt', string] // Required: NIP-31 description
  | string[]; // Other custom tags

// ============================================================================
// Campaign Data Model (Parsed from Events)
// ============================================================================

/**
 * Campaign model parsed from CampaignEvent
 */
export interface Campaign {
  /** Unique campaign identifier (from d-tag) */
  id: string;
  /** Campaign title */
  title: string;
  /** Campaign description (markdown) */
  description: string;
  /** Campaign categories */
  categories: CampaignCategory[];
  /** Target government levels */
  targetLevels: TargetLevel[];
  /** Campaign status */
  status: CampaignStatus;
  /** Campaign creator public key */
  creatorPubkey: string;
  /** Campaign creation timestamp */
  createdAt: number;
  /** Campaign event ID */
  eventId: string;
  /** Optional: NIP-31 alt description */
  alt?: string;
  /** Optional: Campaign banner image */
  image?: string;
  /** Optional: Campaign video */
  video?: string;
  /** Optional: Related links */
  links?: string[];
}

/**
 * Campaign metrics (derived from attestations and reposts)
 */
export interface CampaignMetrics {
  /** Total actions taken on campaign */
  totalActions: number;
  /** Actions taken in last 24 hours */
  hotActions: number;
  /** Number of shares (kind 6 reposts) */
  shareCount: number;
  /** Number of reactions (kind 7) */
  reactionCount: number;
  /** Number of comments (kind 1) */
  commentCount: number;
}

/**
 * Campaign with metrics
 */
export interface CampaignWithMetrics extends Campaign {
  /** Campaign metrics */
  metrics: CampaignMetrics;
}

/**
 * Campaign update model parsed from CampaignUpdateEvent
 */
export interface CampaignUpdate {
  /** Campaign ID (from d-tag) */
  campaignId: string;
  /** Update message */
  message: string;
  /** New status (if changed) */
  status?: CampaignStatus;
  /** Update timestamp */
  updatedAt: number;
  /** Update event ID */
  eventId: string;
  /** Updater public key */
  updaterPubkey: string;
}

/**
 * Action attestation model parsed from ActionAttestationEvent
 */
export interface ActionAttestation {
  /** Campaign event ID */
  campaignEventId: string;
  /** Campaign ID (from d-tag) */
  campaignId: string;
  /** User who took action */
  userPubkey: string;
  /** Action timestamp */
  timestamp: number;
  /** Attestation nonce */
  nonce: string;
  /** Number of representatives contacted */
  repCount?: number;
  /** Attestation event ID */
  eventId: string;
}

// ============================================================================
// Utility Functions for Event Parsing
// ============================================================================

/**
 * Check if an event is a campaign event
 */
export function isCampaignEvent(event: NostrEvent): event is CampaignEvent {
  return event.kind === CAMPAIGN_KIND;
}

/**
 * Check if an event is a campaign update event
 */
export function isCampaignUpdateEvent(event: NostrEvent): event is CampaignUpdateEvent {
  return event.kind === CAMPAIGN_UPDATE_KIND;
}

/**
 * Check if an event is an action attestation event
 */
export function isActionAttestationEvent(event: NostrEvent): event is ActionAttestationEvent {
  return event.kind === ACTION_ATTESTATION_KIND;
}

/**
 * Parse campaign event into Campaign model
 */
export function parseCampaign(event: CampaignEvent): Campaign {
  const tags = event.tags;
  
  const dTag = tags.find((t): t is ['d', string] => t[0] === 'd');
  const titleTag = tags.find((t): t is ['title', string] => t[0] === 'title');
  const altTag = tags.find((t): t is ['alt', string] => t[0] === 'alt');
  
  if (!dTag || !titleTag) {
    throw new Error('Invalid campaign event: missing required tags');
  }
  
  const categoryTags = tags.filter((t): t is ['category', CampaignCategory] => t[0] === 'category');
  const targetLevelTags = tags.filter((t): t is ['target_level', TargetLevel] => t[0] === 'target_level');
  const statusTag = tags.find((t): t is ['status', CampaignStatus] => t[0] === 'status');
  const createdAtTag = tags.find((t): t is ['created_at', number] => t[0] === 'created_at');
  const imageTag = tags.find((t): t is ['image', string] => t[0] === 'image');
  const videoTag = tags.find((t): t is ['video', string] => t[0] === 'video');
  const linkTags = tags.filter((t): t is ['link', string] => t[0] === 'link');
  
  return {
    id: dTag[1],
    title: titleTag[1],
    description: event.content,
    categories: categoryTags.map(t => t[1]),
    targetLevels: targetLevelTags.map(t => t[1]),
    status: statusTag?.[1] || 'active',
    creatorPubkey: event.pubkey,
    createdAt: createdAtTag?.[1] || event.created_at,
    eventId: event.id,
    alt: altTag?.[1],
    image: imageTag?.[1],
    video: videoTag?.[1],
    links: linkTags.map(t => t[1]),
  };
}

/**
 * Parse campaign update event into CampaignUpdate model
 */
export function parseCampaignUpdate(event: CampaignUpdateEvent): CampaignUpdate {
  const tags = event.tags;
  
  const dTag = tags.find((t): t is ['d', string] => t[0] === 'd');
  const altTag = tags.find((t): t is ['alt', string] => t[0] === 'alt');
  const statusTag = tags.find((t): t is ['status', CampaignStatus] => t[0] === 'status');
  const updatedAtTag = tags.find((t): t is ['updated_at', number] => t[0] === 'updated_at');
  
  if (!dTag || !altTag) {
    throw new Error('Invalid campaign update event: missing required tags');
  }
  
  return {
    campaignId: dTag[1],
    message: event.content,
    status: statusTag?.[1],
    updatedAt: updatedAtTag?.[1] || event.created_at,
    eventId: event.id,
    updaterPubkey: event.pubkey,
  };
}

/**
 * Parse action attestation event into ActionAttestation model
 */
export function parseActionAttestation(event: ActionAttestationEvent): ActionAttestation {
  const tags = event.tags;
  
  const eTag = tags.find((t): t is ['e', string] => t[0] === 'e');
  const dTag = tags.find((t): t is ['d', string] => t[0] === 'd');
  const timestampTag = tags.find((t): t is ['timestamp', number] => t[0] === 'timestamp');
  const nonceTag = tags.find((t): t is ['nonce', string] => t[0] === 'nonce');
  const repCountTag = tags.find((t): t is ['rep_count', number] => t[0] === 'rep_count');
  const altTag = tags.find((t): t is ['alt', string] => t[0] === 'alt');
  
  if (!eTag || !dTag || !timestampTag || !nonceTag || !altTag) {
    throw new Error('Invalid action attestation event: missing required tags');
  }
  
  return {
    campaignEventId: eTag[1],
    campaignId: dTag[1],
    userPubkey: event.pubkey,
    timestamp: timestampTag[1],
    nonce: nonceTag[1],
    repCount: repCountTag?.[1],
    eventId: event.id,
  };
}

/**
 * Generate random nonce for action attestation
 */
export function generateNonce(): string {
  // Generate 32 random bytes as hex string
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate campaign event tags
 */
export function validateCampaignEvent(event: NostrEvent): boolean {
  if (event.kind !== CAMPAIGN_KIND) return false;
  
  const tags = event.tags;
  const hasD = tags.some(t => t[0] === 'd');
  const hasTitle = tags.some(t => t[0] === 'title');
  const hasCategory = tags.some(t => t[0] === 'category');
  const hasTargetLevel = tags.some(t => t[0] === 'target_level');
  const hasAlt = tags.some(t => t[0] === 'alt');
  
  return hasD && hasTitle && hasCategory && hasTargetLevel && hasAlt;
}

/**
 * Validate action attestation event tags
 */
export function validateActionAttestationEvent(event: NostrEvent): boolean {
  if (event.kind !== ACTION_ATTESTATION_KIND) return false;
  
  const tags = event.tags;
  const hasE = tags.some(t => t[0] === 'e');
  const hasD = tags.some(t => t[0] === 'd');
  const hasTimestamp = tags.some(t => t[0] === 'timestamp');
  const hasNonce = tags.some(t => t[0] === 'nonce');
  const hasAlt = tags.some(t => t[0] === 'alt');
  
  return hasE && hasD && hasTimestamp && hasNonce && hasAlt;
}
