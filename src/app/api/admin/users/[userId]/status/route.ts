import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';

// PUT /api/admin/users/:userId/status - Update user status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    
    console.log('🔄 Proxying user status update request to backend for user:', userId, body);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Transform the data format to match backend expectations
    const transformedBody = {
      status: body.status
    };

    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(transformedBody),
    });

    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to update user status', error: String(error) },
      { status: 500 }
    );
  }
}