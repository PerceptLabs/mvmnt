# Movement - Build Plan & Technical Specification

## Executive Summary

Movement is a civic engagement web app combining Change.org-style campaigns with Democracy.io-style representative contact. Built on MKStack with Nostr for campaign publishing/social proof and Cashu for anti-abuse/sustainability features.

**Tech Stack:**
- Frontend: React 18 + TypeScript + TailwindCSS 3.x + Vite
- Nostr Integration: @nostrify/nostrify + nostr-tools
- Cashu Integration: @cashu/cashu-ts + coco-cashu-core
- Backend: Nostr relays (decentralized) + Optional API for rep lookup/email delivery

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  React App (MKStack)                                         │
│  - Campaign Feed & Detail Pages                             │
│  - Take Action Flow (Rep identification → Message → Send)    │
│  - Campaign Creation Flow                                    │
│  - User Identity (Nostr login)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Public Layer
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Nostr Network Layer                     │
│  - Campaign Events (kind: 31100 - custom)                    │
│  - Campaign Update Events (kind: 31101)                       │
│  - Action Attestation Events (kind: 31102)                    │
│  - Standard Nostr: reactions (kind: 7), reposts (kind: 6)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Private Layer
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Private/Backend Layer                      │
│  - Representative Lookup API (ZIP/address → reps)           │
│  - Message Delivery Service (email/form submission)         │
│  - User Location Data (ZIP/address - stored locally)         │
│  - Rate Limiting & Anti-Abuse (backend + Cashu stakes)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Payments Layer
                              │
┌─────────────────────────────────────────────────────────────┐
│                         Cashu Layer                          │
│  - Anti-Spam Stakes (refundable deposits for campaigns)      │
│  - Optional Donations (Movement infrastructure)              │
│  - Optional Tips (to campaign creators)                      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Separation

**Public Layer (Nostr):**
- Campaign metadata (title, pitch, category, targets)
- Public stats (action counts, timestamps from attestations)
- Proof-of-action events (signed attestations: "npub X took action on Y")
- Social proof (reactions, reposts, comments)
- Identity (npub profiles, optional NIP-05 verification)

**Private Layer (Local/Backend):**
- User address/ZIP (stored in localStorage)
- Representative lookup data
- Message templates and delivery
- User preferences and settings
- Rate limiting state

### 1.3 Security Model

```
Nostr Events (Public):
├─ Campaign: {title, pitch, category, targets, template} ✅
├─ Action Attestation: {campaign_id, timestamp, nonce} ✅
└─ Identity: {npub, optional NIP-05} ✅

Local Storage (Private):
├─ User Address/ZIP 🔒
├─ Representative Data 🔒
└─ Message Delivery State 🔒

Backend (Private):
├─ Rep Lookup API 🔒
├─ Message Delivery Service 🔒
└─ Rate Limiting 🔒

Cashu Mints (Optional):
├─ Stake Deposits (refundable) 💰
├─ Donations (Movement) 💰
└─ Tips (campaign creators) 💰
```

---

## 2. Nostr Event Schema

### 2.1 Event Taxonomy

**Custom Event Kinds:**

| Kind | Name | Description | Storage Type |
|------|------|-------------|--------------|
| 31100 | Campaign | Campaign creation and metadata | Addressable (d-tag) |
| 31101 | Campaign Update | Campaign updates (status, stats) | Addressable (d-tag) |
| 31102 | Action Attestation | Proof of action on a campaign | Regular |

**Standard Nostr Events:**
- Kind 1: Comments (on campaigns)
- Kind 6: Reposts (share campaigns)
- Kind 7: Reactions (👍 campaigns)
- Kind 30023: Long-form content (optional campaign details)

### 2.2 Campaign Event (Kind 31100)

**Purpose:** Campaign creation and metadata

**Storage:** Addressable (identified by pubkey + kind + d-tag)

**Event Schema:**
```json
{
  "kind": 31100,
  "content": "Full campaign description (markdown supported)",
  "tags": [
    ["d", "campaign-unique-id"],
    ["title", "Save the Local Park"],
    ["category", "environment"],
    ["target_level", "federal"],
    ["target_level", "state"],
    ["created_at", 1735689600],
    ["status", "active"],
    ["alt", "Campaign: Save the Local Park"]
  ]
}
```

**Tags Reference:**
- `d` (required): Unique campaign identifier (slug/UUID)
- `title` (required): Campaign title
- `category` (required): Issue category (environment, healthcare, education, etc.)
- `target_level` (required): Government level (federal, state, local)
- `created_at` (optional): Campaign creation timestamp (defaults to event created_at)
- `status` (optional): Campaign status (active, completed, archived - default: active)
- `alt` (required): NIP-31 human-readable description
- Additional custom tags as needed

**Example Event:**
```json
{
  "kind": 31100,
  "content": "## Why This Matters\n\nOur local park is under threat from development...",
  "tags": [
    ["d", "save-local-park-2024"],
    ["title", "Save the Local Park from Development"],
    ["category", "environment"],
    ["category", "community"],
    ["target_level", "local"],
    ["target_level", "state"],
    ["created_at", "1735689600"],
    ["status", "active"],
    ["alt", "Campaign: Save the Local Park from Development"]
  ],
  "created_at": 1735689600,
  "pubkey": "abc123...",
  "sig": "..."
}
```

### 2.3 Campaign Update Event (Kind 31101)

**Purpose:** Campaign updates (status changes, stats, etc.)

**Storage:** Addressable (identified by pubkey + kind + d-tag)

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

**Tags Reference:**
- `d` (required): Must match parent campaign's d-tag
- `status` (optional): New status (active, completed, archived)
- `updated_at` (optional): Update timestamp
- `alt` (required): NIP-31 human-readable description

### 2.4 Action Attestation Event (Kind 31102)

**Purpose:** Proof-of-action that a user contacted representatives

**Storage:** Regular (all events stored)

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
  ],
  "created_at": 1735689600,
  "pubkey": "xyz789...",
  "sig": "..."
}
```

**Tags Reference:**
- `e` (required): Parent campaign event ID
- `d` (required): Campaign d-tag (for filtering)
- `timestamp` (required): Action timestamp (for replay prevention)
- `nonce` (required): Random nonce (for replay prevention)
- `rep_count` (optional): Number of representatives contacted
- `alt` (required): NIP-31 human-readable description

**Security Notes:**
- **No sensitive data**: Never include address, ZIP, or rep names in Nostr events
- **Anti-replay**: timestamp + nonce ensures uniqueness
- **Social proof**: These events generate "action count" metrics
- **Privacy**: Only proves action occurred, not what was said

---

## 3. Cashu Integration

### 3.1 Use Cases

**Anti-Spam / Anti-Abuse:**
- **Stake to Post**: Small refundable deposit (e.g., 100-1000 sats) to create campaigns
- **Stake to Launch**: Optional deposit for high-profile campaigns
- **Refund Rules**: Returned after X hours/days if no abuse detected

**Optional Donations:**
- **Movement Infrastructure**: Support platform development/relays
- **Campaign Creator Tips**: Direct support for campaign creators

### 3.2 Stake Flow

```
User creates campaign → Cashu wallet → Stake deposit (1000 sats)
                                                     │
                                                     │ After campaign creation
                                                     ↓
Campaign published → User waits 24h → Stake refunded
                     (no abuse detected)
```

**Implementation Notes:**
- Stakes are **refundable** deposits, not payments
- Abuse detection: Duplicate campaigns, spam, etc.
- Refund timer: 24 hours minimum (configurable)
- Stake amounts: Configurable per campaign type

### 3.3 Donation Flow

```
User on campaign page → Click "Donate" → Cashu wallet → Send tokens
                                                          │
                                                          │ To Movement mint
                                                          ↓
Donation received → Optional "Thank You" attestation
```

**Donation Options:**
- Fixed amounts: 100, 500, 1000, 5000 sats
- Custom amount input
- Optional "tip campaign creator" toggle

### 3.4 Wallet UX

**Wallet States:**
1. **Not Connected**: Show "Connect Cashu Wallet" button
2. **Connected**: Show balance, stake/donate buttons
3. **Processing**: Show loading spinner during transactions

**UI Patterns:**
- Use drawers/modals for Cashu flows (don't clutter main UI)
- Show stake amount with USD equivalent (using exchange-rates skill)
- Simple "Stake 1000 sats (~$0.03)" buttons for quick actions

---

## 4. Representative Lookup & Message Delivery

### 4.1 Representative Lookup (Stubbed for MVP)

**MVP Implementation (Stubbed):**
- Use placeholder mock data for reps
- Accept ZIP code input
- Display "faked" representative data
- No real API calls in MVP

**Production Implementation (Future):**
- Option A: Use existing APIs (Google Civic Information API, etc.)
- Option B: Build custom representative database
- Option C: Partner with civic tech organizations

**Mock Data Structure:**
```typescript
interface Representative {
  id: string;
  name: string;
  level: 'federal' | 'state' | 'local';
  office: string;
  contactMethod: 'email' | 'form' | 'both';
  email?: string;
  formUrl?: string;
}
```

### 4.2 Message Delivery (Stubbed for MVP)

**MVP Implementation (Stubbed):**
- Allow users to draft and "send" messages
- Show success confirmation (fake)
- Store sent messages in localStorage
- No real email delivery in MVP

**Production Implementation (Future):**
- Option A: Direct email sending via SMTP/API
- Option B: Submit to representative web forms
- Option C: Partner with civic tech delivery services
- Option D: Download letters for manual mailing

### 4.3 User Data Privacy

**Stored Locally:**
- ZIP code / address
- Representative lookup results
- Sent message history
- Drafts

**Never Stored on Nostr:**
- Address/ZIP
- Representative names/contact info
- Message content (beyond public attestations)

---

## 5. Core UX Flows

### 5.1 Campaign Discovery

**Page: `/` (Home)**

**Components:**
- Campaign Feed
  - Tabs: Trending, Hot (24h), New
  - Campaign Cards
  - Infinite scroll

**Campaign Card:**
```
┌─────────────────────────────────────┐
│ [Category Badge] [Hot Badge]      │
│ Save the Local Park                │
│ Protect our green spaces from...   │
│                                    │
│ 1,234 actions  |  56 in last 24h   │
│ 89 shares       |  @creator        │
└─────────────────────────────────────┘
```

**Metrics:**
- Total actions (derived from attestation events)
- Actions in last 24h (filter attestations by timestamp)
- Share count (kind 6 reposts)
- Creator identity (npub + optional NIP-05)

### 5.2 Take Action Flow

**Page: `/campaign/:d` (Campaign Detail)**

**Flow Steps:**

1. **View Campaign**
   - Read campaign details
   - See action count and social proof
   - Click "Take Action"

2. **Identify User**
   - Show form: ZIP code input
   - Optional: "Use my location" button (geolocation API)
   - Submit → Look up representatives

3. **Review Representatives**
   - Display list of reps found
   - Show which reps will be contacted
   - Confirm or edit ZIP/address

4. **Draft Message**
   - Pre-filled message template
   - Editable fields: [NAME], [LOCATION], etc.
   - Personalization prompts
   - Preview final message

5. **Send Message**
   - One-click "Send to all X representatives"
   - Show sending progress
   - Display success confirmation

6. **Post-Action**
   - Generate Action Attestation (kind 31102)
   - Publish to Nostr
   - Show share options (Nostr link, web link, QR code)

### 5.3 Campaign Creation Flow

**Page: `/campaigns/new` (Create Campaign)**

**Flow Steps:**

1. **Campaign Details**
   - Title (required)
   - Category (dropdown: environment, healthcare, etc.)
   - Short pitch (required, 280 chars max)
   - Full description (markdown, optional)
   - Target levels (checkbox: federal, state, local)

2. **Message Template**
   - Draft message to representatives
   - Include placeholders: [NAME], [LOCATION], etc.
   - Preview template

3. **Optional Cashu Stake**
   - "Stake 1000 sats to prevent spam" (optional toggle)
   - Connect Cashu wallet (if not connected)
   - Pay stake (refundable after 24h)

4. **Review & Publish**
   - Preview campaign
   - Confirm all details
   - Publish to Nostr (kind 31100 event)
   - Show share options

### 5.4 Viral Mechanics

**Share Options:**
1. **Nostr Link**: Copy nostr: link or share to Nostr clients
2. **Web Link**: Copy https://movement.app/campaign/xyz link
3. **QR Code**: Generate QR code for mobile sharing
4. **Social Media**: Twitter, Facebook, etc.

**Proof-of-Action:**
```
User takes action → Generate attestation event → Publish to Nostr
                                                │
                                                ↓
Show "Share your action" modal → Generate share links
```

**Social Proof Display:**
- Show avatars of users who took action (from attestations)
- "123 people have taken action on this campaign"
- Display reactions (kind 7) and reposts (kind 6)

---

## 6. UI Screen List & Components

### 6.1 Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `CampaignFeed` | Campaign discovery feed |
| `/campaign/:d` | `CampaignDetail` | Campaign details + take action |
| `/campaigns/new` | `CreateCampaign` | Campaign creation flow |
| `/profile/:npub` | `UserProfile` | User profile + campaign history |
| `/settings` | `SettingsPage` | App settings, Cashu wallet, relay config |

### 6.2 Core Components

**Campaign-Related:**
- `CampaignCard` - Display campaign in feed
- `CampaignDetail` - Full campaign page
- `CampaignFeed` - Campaign list with filters (Trending/Hot/New)
- `CampaignStats` - Display action count, shares, etc.
- `CampaignCreator` - Show creator identity (npub + NIP-05)

**Action-Related:**
- `TakeActionButton` - CTA button for action flow
- `UserLocationForm` - ZIP/address input
- `RepresentativeList` - Display reps found
- `MessageTemplateEditor` - Edit/draft message
- `MessagePreview` - Preview final message
- `ActionConfirmation` - Success screen after action

**Social-Related:**
- `ShareModal` - Share options (Nostr, web, QR code)
- `ProofOfAction` - Display action attestations
- `SocialProof` - Show users who took action
- `Reactions` - Kind 7 reactions display

**Wallet-Related:**
- `CashuConnectButton` - Connect Cashu wallet
- `StakePaymentModal` - Pay stake for campaign creation
- `DonationModal` - Donate to Movement/creator
- `WalletBalance` - Display Cashu balance

**Auth-Related:**
- `LoginArea` - Already in MKStack (Nostr login)
- `UserProfile` - User profile page

### 6.3 State Management

**Global State (AppContext):**
- `cashuWallet`: Cashu wallet connection status
- `userLocation`: User's ZIP/address (from localStorage)
- `representatives`: Cached rep lookup results

**Component State:**
- Campaign feed filters (Trending/Hot/New)
- Campaign creation form data
- Action flow step (identify → reps → message → send)
- Share modal state
- Wallet modal state

---

## 7. Implementation Notes

### 7.1 Relay Handling

**Default Relays (from MKStack):**
```typescript
[
  'wss://relay.ditto.pub',
  'wss://relay.nostr.band',
  'wss://relay.damus.io',
]
```

**Query Strategy:**
- **Campaigns**: Query from all configured relays
- **Attestations**: Query campaign-specific attestations
- **Social proof**: Query reactions/reposts for campaign

**Publishing:**
- Campaigns: Publish to all configured relays
- Attestations: Publish to all configured relays
- Reactions/Reposts: Use standard Nostr behavior

### 7.2 Event Signing & Verification

**Signing:**
- Use MKStack's `useNostrPublish` hook
- All events signed with user's Nostr key (NIP-07)

**Verification:**
- Nostrify handles event verification automatically
- Validate required tags in custom event handlers
- Check signature for action attestations

### 7.3 Cashu Integration Notes

**Using Skills:**
- `cashu-wallet`: Core Cashu functionality (send/receive tokens)
- `exchange-rates`: BTC/USD conversion for stake amounts
- `qr-code-generator`: QR codes for sharing

**Implementation Priority:**
1. **Phase 1 (MVP)**: Stubbed Cashu (wallet connect UI only, no real stakes)
2. **Phase 2**: Real Cashu integration (stakes, refunds)
3. **Phase 3**: Donation flows (Movement infrastructure, creator tips)

### 7.4 Rate Limiting

**Implementation:**
- **Local**: Rate limit based on localStorage (user ID + campaign ID)
- **Backend (Future)**: Server-side rate limiting via IP/npub
- **Nostr**: Use timestamp + nonce in attestations to prevent replay

**Rate Limit Rules:**
- 1 action per user per campaign per 24 hours
- 5 campaigns created per user per 24 hours (with stake)
- No rate limit for viewing campaigns

---

## 8. MVP Path

### 8.1 Phase 1: Core Features (MVP - First Release)

**Must-Have:**
- ✅ Campaign feed (Trending, Hot, New tabs)
- ✅ Campaign detail pages
- ✅ Take action flow (ZIP → reps → message → send - stubbed)
- ✅ Campaign creation flow (title, pitch, category, targets - stubbed)
- ✅ Nostr event publishing (campaigns + attestations)
- ✅ User identity (Nostr login)
- ✅ Social proof (attestation count, reactions, reposts)
- ✅ Share functionality (web links)

**Stubbed/Placeholder:**
- ⚠️ Representative lookup (mock data)
- ⚠️ Message delivery (fake success)
- ⚠️ Cashu stakes (UI only, no real payments)
- ⚠️ Donations (not implemented)
- ⚠️ NIP-05 verification (display only)

**Timeline:** 2-3 weeks

### 8.2 Phase 2: Real-World Integration (Second Release)

**Add:**
- 🔗 Real representative lookup API
- 🔗 Real message delivery service
- 🔗 Cashu stake integration (refunds)
- 🔗 Rate limiting (backend)
- 🔗 Action confirmation emails
- 🔗 Analytics dashboard

**Timeline:** 3-4 weeks

### 8.3 Phase 3: Advanced Features (Future)

**Add:**
- 💰 Donations (Movement infrastructure)
- 💰 Creator tips
- 💰 NIP-05 verification
- 💰 Advanced campaign analytics
- 💰 Mobile app (React Native)
- 💰 Multi-language support

**Timeline:** Ongoing

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Event schema validation (campaign, attestation)
- Utility functions (timestamp formatting, etc.)
- Local storage helpers

### 9.2 Integration Tests
- Campaign feed queries
- Action flow end-to-end
- Nostr event publishing
- Cashu wallet operations

### 9.3 Manual Testing
- User flows (discovery → action → share)
- Nostr relay connectivity
- Cross-browser compatibility
- Mobile responsiveness

---

## 10. Deployment Strategy

### 10.1 Frontend Deployment
- **Platform**: Vercel / Netlify / Shakespeare deployment
- **Build**: `npm run build` (Vite production build)
- **Static Files**: Serve via CDN

### 10.2 Nostr Relays
- Use existing public relays (ditto, damus, nostr.band)
- No dedicated relay infrastructure required

### 10.3 Cashu Mints
- Use existing public Cashu mints
- No dedicated mint infrastructure required

---

## 11. Success Metrics

**User Engagement:**
- Campaigns created per week
- Actions taken per campaign
- Share rate (actions → shares)
- Returning users

**Civic Impact:**
- Total campaigns created
- Total actions taken
- Geographic reach (states/districts)
- Response rate from representatives

**Platform Health:**
- Nostr event propagation rate
- Relay connectivity
- User retention
- Spam rate (with stakes)

---

## 12. Future Enhancements

**Technical:**
- WebSocket-based real-time updates
- Offline support (PWA)
- Push notifications (campaign updates)
- Advanced analytics dashboard

**Civic:**
- Campaign templates (common use cases)
- Group campaigns (multiple organizers)
- Representative tracking (voting records)
- Civic education resources

**Social:**
- Community features (groups, discussions)
- Gamification (badges, levels)
- Influencer campaigns (celebrity endorsements)
- Civic challenges (leaderboards)

---

## Appendix: Quick Reference

### Nostr Event Kinds

| Kind | Purpose | Tags | Content |
|------|---------|------|---------|
| 31100 | Campaign | d, title, category, target_level, status, alt | Markdown description |
| 31101 | Campaign Update | d, status, updated_at, alt | Update message |
| 31102 | Action Attestation | e, d, timestamp, nonce, rep_count, alt | Optional message |
| 1 | Comment | e, p | Comment text |
| 6 | Repost | e, k | Empty |
| 7 | Reaction | e, p, content | Emoji (👍, ❤️, etc.) |

### Cashu Amounts

| Use Case | Amount | USD (approx) |
|----------|--------|--------------|
| Stake to post | 1000 sats | $0.03 |
| Small donation | 5000 sats | $0.15 |
| Medium donation | 25000 sats | $0.75 |
| Large donation | 100000 sats | $3.00 |

*USD amounts based on ~$95,000/BTC exchange rate*

### Campaign Categories

- Environment
- Healthcare
- Education
- Civil Rights
- Economy
- Immigration
- Gun Control
- Housing
- Transportation
- Technology
- Criminal Justice
- Election Reform
- Government Transparency
- Public Safety
- Community

### Target Levels

- Federal (Congress, Senate, President)
- State (Governor, State Legislature)
- Local (Mayor, City Council, School Board)

---

**End of Build Plan**
