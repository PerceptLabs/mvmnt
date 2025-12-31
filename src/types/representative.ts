/**
 * Representative Lookup and User Data Types
 * 
 * Defines types for:
 * - Representative lookup results
 * - User location data
 * - Message delivery
 */

// ============================================================================
// Representative Data Types
// ============================================================================

/**
 * Government level for representatives
 */
export type GovernmentLevel = 'federal' | 'state' | 'local';

/**
 * Representative contact method
 */
export type ContactMethod = 'email' | 'form' | 'both';

/**
 * Representative contact information
 */
export interface RepresentativeContact {
  /** Contact method */
  method: ContactMethod;
  /** Email address (if method is email or both) */
  email?: string;
  /** Web form URL (if method is form or both) */
  formUrl?: string;
  /** Phone number (optional) */
  phone?: string;
  /** Twitter handle (optional) */
  twitter?: string;
}

/**
 * Representative information
 */
export interface Representative {
  /** Unique representative identifier */
  id: string;
  /** Representative name */
  name: string;
  /** Government level */
  level: GovernmentLevel;
  /** Office/position title */
  office: string;
  /** Political party (optional) */
  party?: string;
  /** Contact information */
  contact: RepresentativeContact;
  /** State (optional, for filtering) */
  state?: string;
  /** District/area (optional) */
  district?: string;
  /** Photo URL (optional) */
  photo?: string;
}

/**
 * Representative lookup result
 */
export interface RepresentativeLookupResult {
  /** ZIP code used for lookup */
  zipCode: string;
  /** Address used for lookup (if provided) */
  address?: string;
  /** List of representatives found */
  representatives: Representative[];
  /** Timestamp of lookup */
  lookupTimestamp: number;
}

/**
 * Representative lookup request
 */
export interface RepresentativeLookupRequest {
  /** ZIP code */
  zipCode: string;
  /** Full address (optional, more precise) */
  address?: string;
  /** Government levels to filter (optional) */
  levels?: GovernmentLevel[];
}

// ============================================================================
// User Location Data Types
// ============================================================================

/**
 * User location information (stored locally, NOT on Nostr)
 */
export interface UserLocation {
  /** ZIP code */
  zipCode: string;
  /** Full address (optional) */
  address?: string;
  /** City (optional) */
  city?: string;
  /** State (optional) */
  state?: string;
  /** Country (default: US) */
  country?: string;
  /** Coordinates (optional, from geolocation) */
  coordinates?: {
    lat: number;
    lng: number;
  };
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Stored user preferences for location
 */
export interface UserLocationPreferences {
  /** Use device location (geolocation API) */
  useDeviceLocation: boolean;
  /** Remember location for future visits */
  rememberLocation: boolean;
  /** Auto-lookup representatives when location changes */
  autoLookupReps: boolean;
}

// ============================================================================
// Message Template Types
// ============================================================================

/**
 * Message template for contacting representatives
 */
export interface MessageTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template subject line */
  subject: string;
  /** Template body with placeholders */
  body: string;
  /** Available placeholders */
  placeholders: MessagePlaceholder[];
}

/**
 * Message placeholder types
 */
export type MessagePlaceholder =
  | 'name' // User's name
  | 'location' // User's location (ZIP/city)
  | 'campaign_title' // Campaign title
  | 'campaign_description' // Campaign description
  | 'representative_name' // Representative's name
  | 'representative_office' // Representative's office
  | 'custom' // Custom user input
  | string; // Custom placeholder name

/**
 * Message draft state
 */
export interface MessageDraft {
  /** Campaign ID */
  campaignId: string;
  /** Target representatives */
  representatives: Representative[];
  /** Message subject */
  subject: string;
  /** Message body with placeholders filled */
  body: string;
  /** Custom placeholder values */
  customValues: Record<string, string>;
  /** User name */
  userName?: string;
  /** User ZIP code */
  userZip?: string;
  /** Draft timestamp */
  createdAt: number;
  /** Last modified timestamp */
  lastModified: number;
}

/**
 * Message delivery result
 */
export interface MessageDeliveryResult {
  /** Message ID */
  messageId: string;
  /** Campaign ID */
  campaignId: string;
  /** User public key */
  userPubkey: string;
  /** Representatives contacted */
  representatives: Representative[];
  /** Delivery status per representative */
  deliveries: MessageDelivery[];
  /** Overall success status */
  success: boolean;
  /** Delivery timestamp */
  deliveredAt: number;
}

/**
 * Individual message delivery
 */
export interface MessageDelivery {
  /** Representative ID */
  representativeId: string;
  /** Representative name */
  representativeName: string;
  /** Delivery status */
  status: 'pending' | 'sent' | 'failed';
  /** Error message (if failed) */
  error?: string;
  /** Delivery timestamp */
  deliveredAt?: number;
  /** Delivery method used */
  method?: 'email' | 'form';
}

// ============================================================================
// Message History Types
// ============================================================================

/**
 * Sent message record (stored locally, NOT on Nostr)
 */
export interface SentMessage {
  /** Unique message ID */
  id: string;
  /** Campaign event ID */
  campaignEventId: string;
  /** Campaign ID (d-tag) */
  campaignId: string;
  /** Campaign title */
  campaignTitle: string;
  /** Representatives contacted */
  representatives: Representative[];
  /** Message subject */
  subject: string;
  /** Message body (truncated for storage) */
  body: string;
  /** Delivery timestamp */
  sentAt: number;
  /** Delivery success status */
  success: boolean;
  /** Number of successful deliveries */
  successfulDeliveries: number;
  /** Number of failed deliveries */
  failedDeliveries: number;
}

/**
 * Message history storage key
 */
export const MESSAGE_HISTORY_KEY = 'movement:message_history';

/**
 * Max messages to store in history
 */
export const MAX_MESSAGE_HISTORY = 100;

// ============================================================================
// Cashu Integration Types
// ============================================================================

/**
 * Cashu stake configuration
 */
export interface CashuStakeConfig {
  /** Stake amount in satoshis */
  amount: number;
  /** Minimum stake amount */
  minAmount: number;
  /** Maximum stake amount */
  maxAmount: number;
  /** Refund delay in milliseconds */
  refundDelayMs: number;
  /** Campaign creation requires stake */
  requiredForCreation: boolean;
  /** High-volume actions require stake */
  requiredForHighVolume: boolean;
  /** High-volume action threshold (actions per hour) */
  highVolumeThreshold: number;
}

/**
 * Default Cashu stake configuration
 */
export const DEFAULT_CASHU_STAKE_CONFIG: CashuStakeConfig = {
  amount: 1000, // 1000 sats (~$0.03)
  minAmount: 100,
  maxAmount: 10000,
  refundDelayMs: 24 * 60 * 60 * 1000, // 24 hours
  requiredForCreation: true,
  requiredForHighVolume: false,
  highVolumeThreshold: 10,
};

/**
 * Cashu stake transaction
 */
export interface CashuStakeTransaction {
  /** Transaction ID */
  id: string;
  /** Campaign ID */
  campaignId: string;
  /** User public key */
  userPubkey: string;
  /** Stake amount */
  amount: number;
  /** Staking timestamp */
  stakedAt: number;
  /** Refund timestamp (when stake can be refunded) */
  refundableAt: number;
  /** Refund timestamp (if refunded) */
  refundedAt?: number;
  /** Status */
  status: 'staked' | 'refunded' | 'forfeited';
  /** Reason for forfeiture (if forfeited) */
  forfeitureReason?: string;
}

/**
 * Cashu donation configuration
 */
export interface CashuDonationConfig {
  /** Donation amounts in satoshis */
  amounts: number[];
  /** Support platform development */
  supportInfrastructure: boolean;
  /** Support campaign creators */
  supportCreators: boolean;
}

/**
 * Default Cashu donation amounts
 */
export const DEFAULT_DONATION_AMOUNTS = [
  100, // ~$0.003
  500, // ~$0.015
  1000, // ~$0.03
  5000, // ~$0.15
  10000, // ~$0.30
  25000, // ~$0.75
  50000, // ~$1.50
  100000, // ~$3.00
];

/**
 * Cashu donation transaction
 */
export interface CashuDonationTransaction {
  /** Transaction ID */
  id: string;
  /** Campaign ID (if donating to creator) */
  campaignId?: string;
  /** Donation target */
  target: 'infrastructure' | 'creator';
  /** User public key */
  userPubkey: string;
  /** Donation amount */
  amount: number;
  /** Donation timestamp */
  donatedAt: number;
  /** Transaction successful */
  success: boolean;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Actions per campaign per 24 hours */
  actionsPerCampaignPerDay: number;
  /** Campaigns created per 24 hours */
  campaignsCreatedPerDay: number;
  /** High-volume action threshold (triggers stake requirement) */
  highVolumeThreshold: number;
  /** High-volume window in milliseconds */
  highVolumeWindowMs: number;
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  actionsPerCampaignPerDay: 1,
  campaignsCreatedPerDay: 5,
  highVolumeThreshold: 10,
  highVolumeWindowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Rate limit entry
 */
export interface RateLimitEntry {
  /** User public key */
  userPubkey: string;
  /** Campaign ID (for action limits) */
  campaignId?: string;
  /** Timestamp */
  timestamp: number;
  /** Action type */
  type: 'action' | 'campaign_creation';
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  /** Action is allowed */
  allowed: boolean;
  /** Reason for disallow (if not allowed) */
  reason?: string;
  /** Next allowed timestamp (if rate limited) */
  nextAllowedAt?: number;
  /** Remaining actions in window */
  remaining?: number;
}

// ============================================================================
// Local Storage Keys
// ============================================================================

/**
 * Local storage keys for Movement app
 */
export const STORAGE_KEYS = {
  /** User location data */
  USER_LOCATION: 'movement:user_location',
  /** Location preferences */
  LOCATION_PREFERENCES: 'movement:location_preferences',
  /** Representative lookup cache */
  REPRESENTATIVE_CACHE: 'movement:representative_cache',
  /** Sent message history */
  MESSAGE_HISTORY: 'movement:message_history',
  /** Draft messages */
  MESSAGE_DRAFTS: 'movement:message_drafts',
  /** User preferences */
  USER_PREFERENCES: 'movement:user_preferences',
  /** Rate limit entries */
  RATE_LIMITS: 'movement:rate_limits',
  /** Cashu stake transactions */
  CASHU_STAKES: 'movement:cashu_stakes',
  /** Cashu donation history */
  CASHU_DONATIONS: 'movement:cashu_donations',
} as const;
