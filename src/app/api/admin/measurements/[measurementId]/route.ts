import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';

// GET /api/admin/measurements/:measurementId - Retrieve a specific measurement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  try {
    const { measurementId } = await params;
    
    console.log('🔄 Proxying get measurement request to backend for measurement:', measurementId);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/measurements/${measurementId}`, {
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
      { message: 'Failed to retrieve measurement', error: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/admin/measurements/:measurementId - Update an existing measurement record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  try {
    const { measurementId } = await params;
    const body = await request.json();
    
    console.log('🔄 Proxying update measurement request to backend for measurement:', measurementId, body);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/measurements/${measurementId}`, {
      method: 'PUT',
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
      { message: 'Failed to update measurement', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/measurements/:measurementId - Delete a measurement record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ measurementId: string }> }
) {
  try {
    const { measurementId } = await params;
    
    console.log('🔄 Proxying delete measurement request to backend for measurement:', measurementId);

    // Get the backend URL from environment variables
    const backendUrl = BASE_URL;
    
    // Get the authorization token from the incoming request
    const authHeader = request.headers.get('authorization');
    
    // Forward the request to the actual backend
    const response = await fetch(`${backendUrl}/admin/measurements/${measurementId}`, {
      method: 'DELETE',
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
      { message: 'Failed to delete measurement', error: String(error) },
      { status: 500 }
    );
  }
}