import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';

// GET /api/admin/users/:userId - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    console.log('🔄 Proxying user fetch request to backend for user:', userId);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/users/${userId}`, {
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
      { message: 'Failed to fetch user', error: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/:userId - Update user information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    
    console.log('🔄 Proxying user update request to backend for user:', userId, body);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Transform the data format to match backend expectations
    const transformedBody = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.emailAddress || body.email,
      phoneNumber: body.phoneNumber
    };

    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/users/${userId}`, {
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
      { message: 'Failed to update user', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/:userId - Delete user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    console.log('🔄 Proxying user deletion request to backend for user:', userId);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    // For DELETE, we might not have JSON response data
    if (response.status === 204) {
      // No content response
      return new NextResponse(null, { status: 204 });
    }
    
    const data = await response.json();

    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to delete user', error: String(error) },
      { status: 500 }
    );
  }
}