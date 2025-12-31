/**
 * Civic Gateway API Contracts
 * 
 * Type definitions for API endpoints
 */

export const FIVECALLS_API_BASE = 'https://api.5calls.org/v1';

export const LOW_ACCURACY_THRESHOLD = 0.5;

export const CACHE_TTL = 24 * 60 * 60 * 1000;

export const RATE_LIMITS = {
  PER_IP_PER_MINUTE: 10,
  PER_IP_PER_HOUR: 100,
  PER_SESSION_PER_HOUR: 20,
  PER_EMAIL_PER_MINUTE: 3,
} as const;

export type EmailProvider = 'elastic' | 'sendgrid' | 'mailgun';

export interface Representative {
  id: string;
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  party?: string;
  channels: {
    email?: string;
    phone?: string;
    twitter?: string;
    webform?: string;
  };
  accuracy?: number;
}

export interface CachedRepresentative {
  reps: Representative[];
  timestamp: number;
  zipCode: string;
  addressHash?: string;
  areas?: string[];
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  representativeName: string;
  campaignTitle: string;
  campaignId: string;
  userId?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  recipientEmail?: string;
}

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetAt?: number;
  reason?: string;
}

export interface SessionInfo {
  id: string;
  startTime: number;
  requestCount: number;
  lastEmailSent?: number;
}

export interface IpRateLimit {
  requests: number;
  windowStart: number;
  blockedUntil?: number;
}

export interface AbuseFlags {
  spam: boolean;
  bot: boolean;
  suspicious: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface CacheData {
  [key: string]: {
    data: Representative[];
    timestamp: number;
    zipCode: string;
    addressHash?: string;
    areas?: string[];
  };
}

export interface AnalyticsEvent {
  type: 'rep_lookup' | 'email_sent' | 'error' | 'rate_limit';
  timestamp: number;
  userId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface ConsentRecord {
  userId: string;
  email: string;
  timestamp: number;
  consentGiven: boolean;
  optOutAt?: number;
}