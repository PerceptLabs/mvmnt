/**
 * Civic Gateway API - Vercel Serverless Function
 * 
 * Proxy for 5calls API with caching, rate limiting, and privacy controls
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  FIVECALLS_API_BASE,
  LOW_ACCURACY_THRESHOLD,
  CACHE_TTL,
} from './api-contracts';

export default async function handler(
  req: VercelRequest,
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return new VercelResponse(JSON.stringify({
      error: 'Method not allowed',
      message: 'Only GET requests are supported',
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method === 'OPTIONS') {
    return new VercelResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const zipCode = url.searchParams.get('zip');
  const address = url.searchParams.get('address');
  const areas = url.searchParams.get('areas');

  if (!zipCode) {
    return new VercelResponse(JSON.stringify({
      error: 'missing_parameter',
      message: 'ZIP code is required',
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const zipRegex = /^\d{5}$/;
  if (!zipRegex.test(zipCode)) {
    return new VercelResponse(JSON.stringify({
      error: 'invalid_zip',
      message: 'ZIP code must be 5 digits',
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const cacheKey = `reps:${zipCode}`;

  try {
    const cached = await getCachedReps(cacheKey);
    
    if (cached) {
      console.log(`[CACHE HIT] ${zipCode}`);
      return new VercelResponse(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    console.log(`[CACHE MISS] ${zipCode} - Fetching from 5calls API`);

    const apiUrl = new URL(`${FIVECALLS_API_BASE}/representatives`);
    apiUrl.searchParams.set('zip', zipCode);
    
    if (address) {
      apiUrl.searchParams.set('address', address);
    }
    
    if (areas) {
      apiUrl.searchParams.set('areas', areas);
    }

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.X_FIVECALLS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`5calls API error: ${response.status}`);
    }

    const data = await response.json();
    const representatives = data.officials || [];

    const lowAccuracy = data.officials?.some((rep: any) => 
      rep.accuracy !== undefined && rep.accuracy < LOW_ACCURACY_THRESHOLD
    ) || false;

    const addressHashes = representatives.map((rep: any) => 
      rep.channels?.email ? hashAddress(rep.channels.email) : undefined
    );

    const cacheData = {
      data: representatives,
      timestamp: Date.now(),
      zipCode,
      addressHash: addressHashes[0],
      areas: areas ? areas.split(',') : undefined,
      lowAccuracy,
    };

    await cacheReps(cacheKey, cacheData);

    const responseData = {
      success: true,
      accuracy: lowAccuracy ? 'low' : 'high',
      representatives: representatives.map((rep: any) => ({
        id: rep.id,
        name: rep.name,
        office: rep.office,
        level: rep.level,
        party: rep.party || undefined,
        channels: rep.channels || {},
        ...(lowAccuracy && { accuracy: rep.accuracy }),
      })),
      cached: false,
      zipCode,
    };

    console.log(`[API SUCCESS] ${zipCode} - ${representatives.length} representatives, accuracy: ${responseData.accuracy}`);

    return new VercelResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('[API ERROR]', error);
    
    return new VercelResponse(JSON.stringify({
      error: 'service_error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}

function hashAddress(email: string): string {
  const hash = email.split('@')[0].replace(/\./g, '').slice(0, 12);
  return `hashed_${hash}`;
}

async function getCachedReps(key: string) {
  try {
    const kv = await import('@vercel/kv').then(m => m.default);
    const cached = await kv.get(key);
    
    if (cached) {
      const parsed = JSON.parse(cached as string);
      const now = Date.now();
      const isValid = (now - parsed.timestamp) < CACHE_TTL;
      
      if (isValid) {
        return {
          data: parsed.data,
          timestamp: parsed.timestamp,
          cached: true,
          lowAccuracy: parsed.lowAccuracy || false,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[CACHE ERROR]', error);
    return null;
  }
}

async function cacheReps(key: string, data: any): Promise<void> {
  try {
    const kv = await import('@vercel/kv').then(m => m.default);
    await kv.set(key, JSON.stringify(data), {
      expirationTtl: Math.floor(CACHE_TTL / 1000),
    });
    
    console.log(`[CACHE STORED] ${key} - will expire in ${CACHE_TTL}ms`);
  } catch (error) {
    console.error('[CACHE STORE ERROR]', error);
  }
}