import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';

// POST /api/admin/one-time-codes - Generate a one-time code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔄 Proxying one-time code generation request to backend:', body);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/one-time-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to generate one-time code', error: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/admin/one-time-codes - Get all one-time codes with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    
    console.log('🔄 Proxying one-time codes listing request to backend:', { page, limit });

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/one-time-codes?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch one-time codes', error: String(error) },
      { status: 500 }
    );
  }
}