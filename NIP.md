# Movement - Nostr Protocol Extension

## Overview

This document defines custom Nostr event kinds for the Movement civic engagement platform. These events enable decentralized campaign creation, social proof through action attestations, and viral sharing mechanisms.

## Event Kinds

### Kind 31100: Campaign Event

**Purpose:** Create and store civic engagement campaigns

**Storage:** Addressable (identified by pubkey + kind + d-tag)

**Description:**
Campaigns represent civic issues that users can take action on. Each campaign includes metadata about the issue, target government levels, and a call-to-action for contacting representatives.

**Event Schema:**

```json
{
  "kind": 31100,
  "content": "Full campaign description (markdown supported)",
  "tags": [
    ["d", "campaign-unique-id"],
    ["title", "Campaign Title"],
    ["category", "environment"],
    ["target_level", "federal"],
    ["created_at", 1735689600],
    ["status", "active"],
    ["alt", "Campaign: Campaign Title"]
  ]
}
```

**Tags:**

| Tag | Required | Description | Example |
|-----|----------|-------------|---------|
| `d` | ✅ Yes | Unique campaign identifier (slug or UUID) | `"save-local-park-2024"` |
| `title` | ✅ Yes | Campaign title | `"Save the Local Park"` |
| `category` | ✅ Yes | Issue category (may have multiple) | `"environment"`, `"healthcare"` |
| `target_level` | ✅ Yes | Government level to target (may have multiple) | `"federal"`, `"state"`, `"local"` |
| `created_at` | ❌ No | Campaign creation timestamp (defaults to event.created_at) | `1735689600` |
| `status` | ❌ No | Campaign status (default: "active") | `"active"`, `"completed"`, `"archived"` |
| `alt` | ✅ Yes | NIP-31 human-readable description | `"Campaign: Save the Local Park"` |

**Supported Categories:**
- `environment` - Environmental issues
- `healthcare` - Healthcare and medicine
- `education` - Education policy
- `civil_rights` - Civil rights and equality
- `economy` - Economic policy
- `immigration` - Immigration reform
- `gun_control` - Gun safety legislation
- `housing` - Housing and homelessness
- `transportation` - Transportation infrastructure
- `technology` - Technology and digital rights
- `criminal_justice` - Criminal justice reform
- `election_reform` - Electoral reform
- `government_transparency` - Government accountability
- `public_safety` - Public safety issues
- `community` - Community and local issues

**Supported Target Levels:**
- `federal` - Federal government (Congress, Senate, President)
- `state` - State government (Governor, State Legislature)
- `local` - Local government (Mayor, City Council, School Board)

**Supported Status Values:**
- `active` - Campaign is currently accepting actions (default)
- `completed` - Campaign has achieved its goal or expired
- `archived` - Campaign is archived and read-only

**Content Field:**
Full campaign description supporting markdown. This should include:
- Why this issue matters
- Background information
- Specific ask from representatives
- Additional resources or links

**Example Event:**

```json
{
  "kind": 31100,
  "content": "## Why This Matters\n\nOur local park is under threat from commercial development. This green space has been a community gathering place for over 50 years.\n\n## What We're Asking\n\nWe're asking our city council and state representatives to:\n\n1. Reject the current commercial development proposal\n2. Designate the park as protected green space\n3. Invest in park maintenance and improvements\n\n## How to Help\n\nUse the \"Take Action\" button to contact your representatives directly.",
  "tags": [
    ["d", "save-local-park-2024"],
    ["title", "Save the Local Park from Development"],
    ["category", "environment"],
    ["category", "community"],
    ["target_level", "local"],
    ["target_level", "state"],
    ["created_at", 1735689600],
    ["status", "active"],
    ["alt", "Campaign: Save the Local Park from Development"]
  ],
  "created_at": 1735689600,
  "pubkey": "abc123...",
  "sig": "..."
}
```

**Query Examples:**

```typescript
// Get all active campaigns
const campaigns = await nostr.query([{
  kinds: [31100],
  '#t': ['active'],
  limit: 20,
}]);

// Get campaigns by category
const environmentCampaigns = await nostr.query([{
  kinds: [31100],
  '#t': ['environment'],
  limit: 20,
}]);

// Get a specific campaign by d-tag
const campaign = await nostr.query([{
  kinds: [31100],
  authors: [pubkey],
  '#d': ['save-local-park-2024'],
  limit: 1,
}]);
```

---

### Kind 31101: Campaign Update Event

**Purpose:** Update campaign status or publish updates

**Storage:** Addressable (identified by pubkey + kind + d-tag)

**Description:**
Campaign updates allow organizers to change campaign status, announce milestones, or provide progress reports. Only the campaign creator can publish updates.

**Event Schema:**

```json
{
  "kind": 31101,
  "content": "Update message (optional)",
  "tags": [
    ["d", "campaign-unique-id"],
    ["status", "completed"],
    ["updated_at", 1735776000],
    ["alt", "Campaign Update: Save the Local Park"]
  ]
}
```

**Tags:**

| Tag | Required | Description | Example |
|-----|----------|-------------|---------|
| `d` | ✅ Yes | Must match parent campaign's d-tag | `"save-local-park-2024"` |
| `status` | ❌ No | New campaign status | `"completed"`, `"active"`, `"archived"` |
| `updated_at` | ❌ No | Update timestamp | `1735776000` |
| `alt` | ✅ Yes | NIP-31 human-readable description | `"Campaign Update: Campaign reached 1000 actions"` |

**Content Field:**
Optional update message explaining the change or providing additional context. Supports markdown.

**Example Event:**

```json
{
  "kind": 31101,
  "content": "## Victory! 🎉\n\nThe city council has voted to protect our local park from development. Thanks to all 1,234 of you who took action and contacted your representatives.",
  "tags": [
    ["d", "save-local-park-2024"],
    ["status", "completed"],
    ["updated_at", 1735776000],
    ["alt", "Campaign Update: Save the Local Park - Victory!"]
  ],
  "created_at": 1735776000,
  "pubkey": "abc123...",
  "sig": "..."
}
```

**Query Examples:**

```typescript
// Get all updates for a campaign
const updates = await nostr.query([{
  kinds: [31101],
  '#d': ['save-local-park-2024'],
  limit: 50,
}]);

// Get the latest update (most recent by created_at)
const latestUpdate = updates[0];
```

---

### Kind 31102: Action Attestation Event

**Purpose:** Prove that a user took action on a campaign

**Storage:** Regular (all events stored)

**Description:**
Action attestations provide social proof that users have contacted representatives about a campaign. These events are used to calculate action counts and drive viral sharing.

**Critical Security Note:** 
**Never include sensitive personal information** (addresses, ZIP codes, representative names, message content) in these events. The attestation only proves that an action occurred, not the details of the action.

**Event Schema:**

```json
{
  "kind": 31102,
  "content": "I contacted my representatives about this campaign",
  "tags": [
    ["e", "parent-campaign-event-id"],
    ["d", "campaign-unique-id"],
    ["timestamp", 1735689600],
    ["nonce", "unique-random-nonce"],
    ["rep_count", "3"],
    ["alt", "Action Attestation: User took action on campaign"]
  ]
}
```

**Tags:**

| Tag | Required | Description | Example |
|-----|----------|-------------|---------|
| `e` | ✅ Yes | Parent campaign event ID | `"def456..."` |
| `d` | ✅ Yes | Campaign d-tag (for filtering) | `"save-local-park-2024"` |
| `timestamp` | ✅ Yes | Action timestamp (for replay prevention) | `1735689600` |
| `nonce` | ✅ Yes | Random nonce (for replay prevention) | `"a1b2c3d4..."` |
| `rep_count` | ❌ No | Number of representatives contacted | `"3"` |
| `alt` | ✅ Yes | NIP-31 human-readable description | `"Action Attestation: User took action on campaign"` |

**Anti-Replay Protection:**
- `timestamp`: Unix timestamp of when the action occurred
- `nonce`: Cryptographically random nonce (32+ random bytes or UUID)
- Combination ensures each attestation is unique

**Content Field:**
Optional message about the action. This should be generic and not contain any sensitive information.

**Example Event:**

```json
{
  "kind": 31102,
  "content": "I contacted my representatives about protecting the local park",
  "tags": [
    ["e", "def4567890abcdef"],
    ["d", "save-local-park-2024"],
    ["timestamp", "1735689600"],
    ["nonce", "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"],
    ["rep_count", "3"],
    ["alt", "Action Attestation: User took action on Save the Local Park"]
  ],
  "created_at": 1735689600,
  "pubkey": "xyz789...",
  "sig": "..."
}
```

**Query Examples:**

```typescript
// Get all attestations for a campaign
const attestations = await nostr.query([{
  kinds: [31102],
  '#d': ['save-local-park-2024'],
  limit: 100,
}]);

// Get attestations in the last 24 hours (for "Hot" metric)
const now = Math.floor(Date.now() / 1000);
const oneDayAgo = now - 86400;
const hotAttestations = attestations.filter(a => {
  const timestamp = parseInt(a.tags.find(t => t[0] === 'timestamp')?.[1] || '0');
  return timestamp >= oneDayAgo;
});

// Get attestations by a specific user
const userActions = await nostr.query([{
  kinds: [31102],
  authors: [userPubkey],
  limit: 50,
}]);
```

---

## Standard Nostr Events Used

### Kind 1: Comments

Used for comments on campaigns and discussions.

```json
{
  "kind": 1,
  "content": "Comment text",
  "tags": [
    ["e", "campaign-event-id"],
    ["p", "campaign-author-pubkey"]
  ]
}
```

### Kind 6: Reposts

Used for sharing campaigns to followers.

```json
{
  "kind": 6,
  "content": "",
  "tags": [
    ["e", "campaign-event-id"],
    ["p", "campaign-author-pubkey"],
    ["k", "31100"]
  ]
}
```

### Kind 7: Reactions

Used for expressing support (👍, ❤️, etc.) on campaigns.

```json
{
  "kind": 7,
  "content": "👍",
  "tags": [
    ["e", "campaign-event-id"],
    ["p", "campaign-author-pubkey"]
  ]
}
```

---

## Campaign Metrics Calculation

### Total Action Count

```typescript
function getActionCount(campaignId: string, attestations: NostrEvent[]): number {
  return attestations.filter(a => 
    a.tags.some(t => t[0] === 'd' && t[1] === campaignId)
  ).length;
}
```

### Actions in Last 24 Hours (Hot Metric)

```typescript
function getHotActionCount(campaignId: string, attestations: NostrEvent[]): number {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;
  
  return attestations.filter(a => {
    const isCampaign = a.tags.some(t => t[0] === 'd' && t[1] === campaignId);
    if (!isCampaign) return false;
    
    const timestampTag = a.tags.find(t => t[0] === 'timestamp');
    const timestamp = timestampTag ? parseInt(timestampTag[1]) : a.created_at;
    return timestamp >= oneDayAgo;
  }).length;
}
```

### Share Count

```typescript
async function getShareCount(campaignEventId: string): Promise<number> {
  const reposts = await nostr.query([{
    kinds: [6],
    '#e': [campaignEventId],
    limit: 100,
  }]);
  return reposts.length;
}
```

---

## Security and Privacy Guidelines

### What to Store on Nostr (Public Layer)

✅ **Campaign Metadata**
- Title, description, category
- Target government levels
- Campaign status
- Creation timestamp

✅ **Social Proof**
- Action attestations (timestamp + nonce only)
- Reactions and reposts
- Comments

✅ **Identity**
- User npub
- Optional NIP-05 verification

### What NOT to Store on Nostr (Private Layer)

❌ **Personal Information**
- User addresses or ZIP codes
- Representative names or contact info
- Phone numbers or email addresses

❌ **Message Content**
- Draft messages to representatives
- Sent message content (beyond public attestations)

❌ **Sensitive Campaign Data**
- Internal campaign notes
- Strategy discussions
- Donor information

### Data Architecture

```
Nostr (Public):
├── Campaign events (kind 31100)
├── Campaign update events (kind 31101)
├── Action attestations (kind 31102) - no sensitive data
├── Reactions (kind 7)
├── Reposts (kind 6)
└── Comments (kind 1)

Local Storage (Private):
├── User address/ZIP
├── Representative lookup results
├── Sent message history
├── Drafts
└── User preferences

Backend (Future):
├── Representative lookup API
├── Message delivery service
├── Rate limiting
└── Abuse detection
```

---

## Implementation Checklist

### Event Validation

- [ ] Validate required tags for each event kind
- [ ] Check tag formats (timestamps as numbers, nonces as strings)
- [ ] Verify category values against allowed list
- [ ] Verify target_level values against allowed list
- [ ] Verify status values against allowed list

### Anti-Replay Protection

- [ ] Generate random nonces for attestations
- [ ] Check for duplicate (timestamp + nonce) combinations
- [ ] Filter attestations with invalid timestamps

### Privacy Protection

- [ ] Never include addresses/ZIP in Nostr events
- [ ] Never include representative contact info in Nostr events
- [ ] Validate all outgoing events for sensitive data
- [ ] Clear error messages for blocked content

### Metrics Calculation

- [ ] Calculate total action count from attestations
- [ ] Calculate 24-hour "hot" action count
- [ ] Calculate share count from reposts
- [ ] Cache metrics for performance

---

## Future Enhancements

### Proposed New Kinds

**Kind 31103: Campaign Comment Thread** (if kind 1 proves insufficient)
- Structured comments with parent-child relationships
- Support for nested replies

**Kind 31104: Campaign Endorsement** (for public figures/organizations)
- Formal endorsements from influencers or organizations
- Verified identity support

**Kind 31105: Campaign Milestone**
- Campaign progress milestones
- Achievements and updates

### Future Tags

- `image`: Campaign banner image URL (NIP-94 tags for file metadata)
- `video`: Campaign video URL
- `link`: Related links and resources
- `location`: Geographic focus (state, district, city)

---

## References

- [NIP-01: Nostr Protocol](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-10: Text Notes and Threads](https://github.com/nostr-protocol/nips/blob/master/10.md)
- [NIP-31: Alt Tag](https://github.com/nostr-protocol/nips/blob/master/31.md)
- [NIP-90: Data Structures](https://github.com/nostr-protocol/nips/blob/master/90.md)

---

**Last Updated:** 2025-01-01
**Version:** 1.0.0
