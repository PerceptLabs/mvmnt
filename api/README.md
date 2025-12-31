# Movement - Civic Gateway API

Serverless functions for representative lookup and email sending.

## API Endpoints

### GET /api/reps

Look up representatives for a given ZIP code.

**Query Parameters:**
- `zip` (required): 5-digit ZIP code
- `address` (optional): Full address for better accuracy

**Example:**
```
GET /api/reps?zip=90210
```

**Response:**
```json
{
  "success": true,
  "accuracy": "high",
  "lowAccuracy": false,
  "representatives": [
    {
      "id": "ca_senator_feinstein_0",
      "name": "Dianne Feinstein",
      "office": "U.S. Senate",
      "level": "federal",
      "party": "Democratic",
      "channels": {
        "email": "senator@senate.gov"
      },
      "accuracy": 0.95
    }
  ],
  "cached": false,
  "zipCode": "90210"
}
```

### POST /api/send

Send email to a representative.

**Request Body:**
```json
{
  "to": "senator@senate.gov",
  "subject": "Support for Campaign",
  "body": "Dear Senator,\n\nI am writing...",
  "representativeName": "Sen. Dianne Feinstein",
  "campaignTitle": "Clean Energy Act",
  "campaignId": "clean-energy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "recipientEmail": "senator@senate.gov",
  "provider": "sendgrid",
  "timestamp": 1699876543
}
```

## Environment Variables

```bash
X_FIVECALLS_API_KEY=your_api_key
ELASTIC_EMAIL_API_KEY=your_elastic_key
SENDGRID_API_KEY=your_sendgrid_key
MAILGUN_API_KEY=your_mailgun_key
```

## Deployment

```bash
vercel --prod
```