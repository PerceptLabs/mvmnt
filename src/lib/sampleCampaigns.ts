/**
 * Sample Campaign Data
 * 
 * Example campaigns for demo purposes when Nostr is empty
 */

import type { Campaign, CampaignCategory, TargetLevel } from '@/types/nostr';

export const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: 'save-local-park',
    title: 'Save Central Park from Development',
    description: `## Why This Matters

Central Park has been a treasured community space for over 50 years. It's where families gather for picnics, children play, and nature enthusiasts observe local wildlife.

## The Threat

A developer has proposed building a shopping complex on the northern section of the park. This would destroy 3 acres of mature trees and eliminate a popular walking trail.

## What We're Asking For

We're asking the City Council to:
1. Reject the current development proposal
2. Designate the park as protected green space
3. Invest in park maintenance and improvements instead

## How to Help

Use the "Take Action" button to contact your city council representatives. Every voice matters in protecting our community spaces.`,
    description: 'Central Park has been a treasured community space for over 50 years. Help us protect it from development.',
    categories: ['environment', 'community'],
    targetLevels: ['local'],
    status: 'active',
    creatorPubkey: 'npub1demo123456789abcdefghijklmnopqrstuvwxyz',
    createdAt: Date.now() / 1000 - 86400 * 2, // 2 days ago
    eventId: 'note1savepark123456789abcdefghijklmnop',
  },
  {
    id: 'universal-healthcare',
    title: 'Support Universal Healthcare Access',
    description: `## The Issue

Millions of Americans lack access to affordable healthcare. Medical debt is the leading cause of bankruptcy in our country.

## Our Goal

We believe healthcare is a human right. We're calling for:
1. Expanded Medicaid coverage in all states
2. Public option for healthcare insurance
3. Price caps on prescription medications

## Take Action

Contact your federal representatives to demand comprehensive healthcare reform.`,
    description: 'Healthcare is a human right. Join us in demanding universal healthcare access for all Americans.',
    categories: ['healthcare'],
    targetLevels: ['federal', 'state'],
    status: 'active',
    creatorPubkey: 'npub1demo223456789abcdefghijklmnopqrstuvwx',
    createdAt: Date.now() / 1000 - 86400 * 5, // 5 days ago
    eventId: 'note1health123456789abcdefghijklmnopq',
  },
  {
    id: 'clean-energy-jobs',
    title: 'Invest in Clean Energy Jobs',
    description: `## The Opportunity

Clean energy is the future, and we should be leading the way. Federal investment in solar, wind, and electric vehicle infrastructure can create millions of good-paying jobs.

## What We Propose

1. $100 billion investment in clean energy infrastructure
2. Job training programs for renewable energy sectors
3. Tax incentives for clean energy businesses
4. Grid modernization for efficient energy distribution

## Economic Impact

This investment would create over 2 million jobs while combating climate change.`,
    description: 'Clean energy investment can create 2 million jobs while fighting climate change. Support the Green Jobs Act.',
    categories: ['economy', 'environment'],
    targetLevels: ['federal'],
    status: 'active',
    creatorPubkey: 'npub1demo323456789abcdefghijklmnopqrstu',
    createdAt: Date.now() / 1000 - 86400 * 1, // 1 day ago
    eventId: 'note1energy123456789abcdefghijklmnopqr',
  },
  {
    id: 'voting-rights-act',
    title: 'Protect Voting Rights for All',
    description: `## The Crisis

Across the country, states are passing restrictive voting laws that disproportionately affect minority communities, young voters, and elderly citizens.

## Our Demands

1. Federal legislation protecting voting access
2. Automatic voter registration for all citizens
3. Restore the Voting Rights Act protections
4. End partisan gerrymandering

## Democracy Matters

Voting is the foundation of our democracy. We must protect every citizen's right to have their voice heard.`,
    description: 'Voting is the foundation of our democracy. Protect every citizen\'s right to vote.',
    categories: ['election_reform', 'civil_rights'],
    targetLevels: ['federal', 'state'],
    status: 'active',
    creatorPubkey: 'npub1demo423456789abcdefghijklmnopqrst',
    createdAt: Date.now() / 1000 - 86400 * 3, // 3 days ago
    eventId: 'note1voting123456789abcdefghijklmnop',
  },
  {
    id: 'public-school-funding',
    title: 'Fully Fund Public Schools',
    description: `## The Problem

Public schools across the nation are underfunded, leading to larger class sizes, outdated materials, and teacher shortages.

## Our Plan

1. Increase federal education funding by 25%
2. Equalize school funding across districts
3. Pay teachers competitive wages
4. Provide free meals to all students

## Every Child Deserves Quality Education

A strong public education system is essential for a thriving democracy.`,
    description: 'Every child deserves quality education. Demand fully funded public schools in your district.',
    categories: ['education'],
    targetLevels: ['federal', 'state', 'local'],
    status: 'active',
    creatorPubkey: 'npub1demo523456789abcdefghijklmnopqrs',
    createdAt: Date.now() / 1000 - 86400 * 7, // 7 days ago
    eventId: 'note1school123456789abcdefghijklmnop',
  },
  {
    id: 'immigration-reform',
    title: 'Fair and Humane Immigration Reform',
    description: `## Current Crisis

Our immigration system is broken. Families are being separated, asylum seekers are turned away, and essential workers lack pathways to citizenship.

## Common-Sense Solutions

1. Pathway to citizenship for DREAMers
2. Humane border policies
3. Family reunification priorities
4. Work permits for essential workers

## America Needs Immigrants

Immigration has always been America's strength. Let's fix our system the right way.`,
    description: 'Immigration has always been America\'s strength. Support fair and humane immigration reform.',
    categories: ['immigration'],
    targetLevels: ['federal'],
    status: 'active',
    creatorPubkey: 'npub1demo623456789abcdefghijklmnopqrst',
    createdAt: Date.now() / 1000 - 86400 * 4, // 4 days ago
    eventId: 'note1immig123456789abcdefghijklmnop',
  },
  {
    id: 'police-reform',
    title: 'Demand Police Accountability',
    description: `## The Need for Change

Communities across America are calling for police reform that ensures accountability, transparency, and justice for all.

## Key Reforms We Support

1. Ban chokeholds and no-knock warrants
2. Mandatory body cameras for all officers
3. Independent investigations of police misconduct
4. Mental health crisis response teams

## Justice for All

We must rebuild trust between communities and law enforcement.`,
    description: 'We need police accountability and reform to ensure justice for all communities.',
    categories: ['criminal_justice', 'civil_rights'],
    targetLevels: ['federal', 'state', 'local'],
    status: 'active',
    creatorPubkey: 'npub1demo723456789abcdefghijklmnopqrst',
    createdAt: Date.now() / 1000 - 86400 * 6, // 6 days ago
    eventId: 'note1police123456789abcdefghijklmnop',
  },
  {
    id: 'affordable-housing',
    title: 'Make Housing Affordable',
    description: `## Housing Crisis

Rising rent prices and stagnant wages have created a housing crisis. Millions of Americans spend over 30% of their income on housing.

## Solutions

1. Expand Section 8 housing vouchers
2. Invest in affordable housing construction
3. Rent control measures in high-cost areas
4. Down payment assistance for first-time buyers

## Everyone Deserves a Home

Housing is a basic human need. Let's make it affordable for everyone.`,
    description: 'Housing is a basic human need. Join us in making housing affordable for everyone.',
    categories: ['housing', 'economy'],
    targetLevels: ['federal', 'state', 'local'],
    status: 'active',
    creatorPubkey: 'npub1demo823456789abcdefghijklmnopqrst',
    createdAt: Date.now() / 1000 - 86400 * 2, // 2 days ago
    eventId: 'note1housing123456789abcdefghijklmnop',
  },
];

/**
 * Get featured campaigns for hero section
 */
export function getFeaturedCampaigns(count = 3): Campaign[] {
  return SAMPLE_CAMPAIGNS.slice(0, count);
}

/**
 * Get campaigns by category
 */
export function getCampaignsByCategory(category: CampaignCategory): Campaign[] {
  return SAMPLE_CAMPAIGNS.filter(c => c.categories.includes(category));
}

/**
 * Get campaigns sorted by recency (newest first)
 */
export function getNewCampaigns(count = 20): Campaign[] {
  return [...SAMPLE_CAMPAIGNS]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, count);
}

/**
 * Get campaigns sorted by "hot" (recent activity)
 * For demo, using createdAt as proxy for hotness
 */
export function getHotCampaigns(count = 20): Campaign[] {
  const now = Date.now() / 1000;
  const oneDayAgo = now - 86400;
  
  return [...SAMPLE_CAMPAIGNS]
    .filter(c => c.createdAt >= oneDayAgo)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, count);
}

/**
 * Get campaigns sorted by "trending" (most actions)
 * For demo, using a mock score based on multiple factors
 */
export function getTrendingCampaigns(count = 20): Campaign[] {
  return [...SAMPLE_CAMPAIGNS]
    .sort((a, b) => {
      // Mock trending score: recency + category bonus
      const scoreA = a.createdAt + (a.categories.length * 10000);
      const scoreB = b.createdAt + (b.categories.length * 10000);
      return scoreB - scoreA;
    })
    .slice(0, count);
}

/**
 * Get a single campaign by ID
 */
export function getCampaignById(id: string): Campaign | undefined {
  return SAMPLE_CAMPAIGNS.find(c => c.id === id);
}

/**
 * Get sample user data for campaign creators
 */
export const SAMPLE_USERS: Record<string, { name: string; picture?: string }> = {
  'npub1demo123456789abcdefghijklmnopqrstuvwxyz': {
    name: 'Sarah Green',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  },
  'npub1demo223456789abcdefghijklmnopqrstuvwx': {
    name: 'Dr. James Wilson',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
  },
  'npub1demo323456789abcdefghijklmnopqrstu': {
    name: 'Maria Chen',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
  },
  'npub1demo423456789abcdefghijklmnopqrst': {
    name: 'Robert Johnson',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert',
  },
  'npub1demo523456789abcdefghijklmnopqrs': {
    name: 'Emily Thompson',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
  },
  'npub1demo623456789abcdefghijklmnopqrst': {
    name: 'Carlos Rodriguez',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
  },
  'npub1demo723456789abcdefghijklmnopqrst': {
    name: 'Lisa Washington',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
  },
  'npub1demo823456789abcdefghijklmnopqrst': {
    name: 'Michael Brown',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
  },
};

/**
 * Get sample user by pubkey
 */
export function getUserByPubkey(pubkey: string) {
  return SAMPLE_USERS[pubkey] || { name: 'Anonymous', picture: undefined };
}
