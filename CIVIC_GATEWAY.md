# Movement - Civic Gateway Architecture

## Architecture Overview

Movement is a Vite + React SPA with Nostr (browser talks to relays over wss://). The frontend remains static-hostable. A minimal "Civic Gateway" layer adds representative lookup and email sending capabilities.

```
Frontend (Vercel) → Civic Gateway → 5calls API / Email Provider
       ↓                    ↓
   Nostr Relays        Serverless Functions
```

## Endpoints

### GET /api/reps

Proxy to 5calls API with caching.

**Request:**
```
GET /api/reps?zip=90210
```

**Response:**
```json
{
  "success": true,
  "accuracy": "high",
  "representatives": [
    {
      "id": "ca_senator_feinstein_0",
      "name": "Dianne Feinstein",
      "office": "U.S. Senate",
      "level": "federal",
      "party": "Democratic",
      "channels": { "email": "senator@senate.gov" }
    }
  ]
}
```

### POST /api/send

Send email via Elastic Email/SendGrid/Mailgun.

**Request:**
```json
{
  "to": "senator@senate.gov",
  "subject": "Support for Campaign",
  "body": "Dear Senator..."
}
```

## Caching Strategy

- **Vercel KV** for fast lookups
- **TTL**: 24 hours
- **Cache Key**: `reps:{zipCode}`
- **Privacy**: ZIP-only, no full addresses

## Rate Limiting

- IP: 10 req/min, 100/hour
- Session: 20 emails/hour
- Email: 3/min, 20/hour

## Privacy

- No PII logging
- Address hashing before caching
- Consent flow for emails
- Government email allowlist

## Deployment

```bash
vercel --prod
```

Environment variables:
- X_FIVECALLS_API_KEY
- ELASTIC_EMAIL_API_KEY / SENDGRID_API_KEY / MAILGUN_API_KEY