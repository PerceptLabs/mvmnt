/**
 * Civic Gateway API - Vercel Serverless Function
 * 
 * Send emails to representatives via third-party provider
 * Supports: Elastic Email, SendGrid, Mailgun
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import type { SendEmailRequest, SendEmailResponse } from './api-contracts';

const ELASTIC_EMAIL_API_KEY = process.env.ELASTIC_EMAIL_API_KEY || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';

interface EmailProvider {
  name: string;
  send: (to: string, subject: string, body: string) => Promise<any>;
}

const elasticEmail: EmailProvider = {
  name: 'elastic',
  send: async (to, subject, body) => {
    const response = await fetch('https://api.elasticemail.com/v2/emails', {
      method: 'POST',
      headers: {
        'X-ElasticAPI-Key': ELASTIC_EMAIL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [{ type: 'to', email: to }],
        content: {
          type: 'custom',
          raw: `Subject: ${subject}

From: Movement <noreply@movement.app>

${body}`,
        },
      }),
    });

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(`Elastic Email error: ${JSON.stringify(data.errors)}`);
    }

    return data;
  },
};

const sendgridEmail: EmailProvider = {
  name: 'sendgrid',
  send: async (to, subject, body) => {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          from: { email: 'noreply@movement.app', name: 'Movement' },
          subject: subject,
          content: [{ type: 'text/plain', value: body }],
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid error: ${errorText}`);
    }

    return { success: true };
  },
};

const mailgunEmail: EmailProvider = {
  name: 'mailgun',
  send: async (to, subject, body) => {
    const domain = MAILGUN_API_KEY.split(':')[0];
    const apiKey = MAILGUN_API_KEY.split(':')[1] || '';

    const formData = new URLSearchParams();
    formData.append('from', 'Movement <noreply@movement.app>');
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', body);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa('api:' + apiKey)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!data.id) {
      throw new Error('Mailgun error: Unable to send email');
    }

    return data;
  },
};

function getProvider(): EmailProvider {
  if (ELASTIC_EMAIL_API_KEY) {
    console.log('[EMAIL PROVIDER] Using Elastic Email');
    return elasticEmail;
  }
  if (SENDGRID_API_KEY) {
    console.log('[EMAIL PROVIDER] Using SendGrid');
    return sendgridEmail;
  }
  if (MAILGUN_API_KEY) {
    console.log('[EMAIL PROVIDER] Using Mailgun');
    return mailgunEmail;
  }

  console.warn('[EMAIL PROVIDER] No email provider configured');
  throw new Error('No email provider configured');
}

export default async function handler(
  req: VercelRequest,
): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return new VercelResponse(JSON.stringify({
      error: 'Method not allowed',
      message: 'Only POST requests are supported',
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method === 'OPTIONS') {
    return new VercelResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body = await req.text();
    const parsedBody = JSON.parse(body);

    const { to, subject, body: emailBody, representativeName, campaignTitle, campaignId, userId } = parsedBody as SendEmailRequest;

    console.log(`[SEND EMAIL] To: ${to}, Representative: ${representativeName}, Campaign: ${campaignTitle}`);

    if (!to || !subject || !emailBody) {
      return new VercelResponse(JSON.stringify({
        error: 'missing_fields',
        message: 'Missing required fields: to, subject, or body',
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new VercelResponse(JSON.stringify({
        error: 'invalid_email',
        message: 'Invalid email format',
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    console.log(`[RATE LIMIT CHECK] userId: ${userId || 'anonymous'}, campaignId: ${campaignId}`);

    const provider = getProvider();
    const result = await provider.send(to, subject, emailBody);

    console.log(`[EMAIL SENT] Provider: ${provider.name}, Result:`, result);

    const responseData: SendEmailResponse = {
      success: true,
      message: 'Email sent successfully',
      recipientEmail: to,
      timestamp: Date.now(),
      provider: provider.name,
    };

    return new VercelResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('[SEND ERROR]', error);

    const responseData: SendEmailResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    };

    return new VercelResponse(JSON.stringify(responseData), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}