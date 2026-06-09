import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';

// GET /api/admin/users/status/:status - Get users by status with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ status: string }> }
) {
  try {
    const { status } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    
    console.log('🔄 Proxying admin users by status request to backend:', { status, page, limit });

    // Validate status parameter
    if (!['active', 'pending', 'archived'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be active, pending, or archived' },
        { status: 400 }
      );
    }

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/users/status/${status}?page=${page}&limit=${limit}`, {
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
      { message: 'Failed to fetch admin users by status', error: String(error) },
      { status: 500 }
    );
  }
}