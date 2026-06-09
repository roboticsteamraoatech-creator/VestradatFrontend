import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';

// GET /api/super-admin/dashboard/stats - Retrieve comprehensive statistics for the super admin dashboard
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Proxying super admin dashboard stats request to backend');

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/super-admin/dashboard/stats`, {
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
      { message: 'Failed to retrieve super admin dashboard stats', error: String(error) },
      { status: 500 }
    );
  }
}