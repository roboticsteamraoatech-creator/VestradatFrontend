import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';

// POST /api/admin/users - Create a new admin user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔄 Proxying admin user creation request to backend:', body);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Transform the data format to match backend expectations
    const transformedBody = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.emailAddress || body.email,
      phoneNumber: body.phoneNumber,
      password: body.password, // Optional password
      existingUserId: body.existingUsersID || body.existingUserId, // For linking existing users
      role: body.role || 'CUSTOMER' // CUSTOMER, TAILOR (not ADMIN)
    };

    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(transformedBody),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      // Return the response from the backend
      return NextResponse.json(data, { status: response.status });
    } else {
      // If not JSON, return text response
      const textData = await response.text();
      return new NextResponse(textData, { status: response.status, headers: { 'content-type': 'text/plain' } });
    }
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to create admin user', error: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/admin/users - Get all users with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    
    console.log('🔄 Proxying admin user listing request to backend:', { page, limit });

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend to get ALL users (no status filter)
    const response = await fetch(`${backendUrl}/admin/users?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      // Return the response from the backend
      return NextResponse.json(data, { status: response.status });
    } else {
      // If not JSON, return text response
      const textData = await response.text();
      return new NextResponse(textData, { status: response.status, headers: { 'content-type': 'text/plain' } });
    }
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch admin users', error: String(error) },
      { status: 500 }
    );
  }
}