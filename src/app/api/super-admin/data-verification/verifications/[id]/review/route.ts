import { NextResponse, NextRequest } from 'next/server';
import { BASE_URL } from '@/config/api';

// POST /api/super-admin/data-verification/verifications/:id/review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await req.json();
    const { status, comments } = body;
    
    // Get token from request headers or directly from localStorage as fallback
    let authToken = req.headers.get('authorization');
    
    // If no auth header in request, try to get token from localStorage
    if (!authToken) {
      // This won't work in server-side, so we need to ensure client sends it
      console.warn('No authorization header in request. Client must include Bearer token.');
    }
    
    // Call the actual backend API
    const backendUrl = `${BASE_URL}/api/super-admin/data-verification/verifications/${id}/review`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization if available
    if (authToken) {
      headers['Authorization'] = authToken;
    }
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status, comments }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return new Response(errorText, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error reviewing verification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to review verification',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}