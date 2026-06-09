import { NextResponse, NextRequest } from 'next/server';
import { BASE_URL } from '@/config/api';

// POST /api/super-admin/data-verification/assign-role/:userId
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const awaitedParams = await params;
    const { userId } = awaitedParams;
    const body = await req.json();
    const { assign } = body;
    
    // Call the actual backend API
    const backendUrl = `${BASE_URL}/api/super-admin/data-verification/assign-role/${userId}`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...req.headers.has('authorization') 
          ? { authorization: req.headers.get('authorization')! } 
          : {},
      },
      body: JSON.stringify({ assign }),
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
    console.error('Error assigning role:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to assign role',
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