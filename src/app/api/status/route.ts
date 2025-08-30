import { getSystemStatus } from '@/lib/airtable';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// In-memory cache for status data
let statusCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: Request) {
  try {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (statusCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Serving status from cache');
      
      const response = NextResponse.json(statusCache);
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      // Add cache headers for the cached response
      response.headers.set('Cache-Control', `public, max-age=${Math.floor((CACHE_DURATION - (now - cacheTimestamp)) / 1000)}`);
      response.headers.set('X-Cache', 'HIT');
      
      return response;
    }
    
    // Fetch fresh data from Airtable
    console.log('Fetching fresh status from Airtable');
    const status = await getSystemStatus();
    
    // Update cache
    statusCache = status;
    cacheTimestamp = now;
    
    // Create response with CORS headers for external access
    const response = NextResponse.json(status);
    
    // Add CORS headers to allow external applications to access this API
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Add cache headers for fresh response
    response.headers.set('Cache-Control', `public, max-age=${Math.floor(CACHE_DURATION / 1000)}`);
    response.headers.set('X-Cache', 'MISS');
    
    return response;
  } catch (error) {
    console.error('Error fetching system status:', error);
    
    // If we have cached data, serve it even if it's stale
    if (statusCache) {
      console.log('Serving stale cached status due to error');
      
      const response = NextResponse.json(statusCache);
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      // Add cache headers indicating stale data
      response.headers.set('Cache-Control', 'public, max-age=0, stale-while-revalidate=300');
      response.headers.set('X-Cache', 'STALE');
      
      return response;
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch system status' }, 
      { status: 500 }
    );
    
    // Add CORS headers to error response as well
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
} 