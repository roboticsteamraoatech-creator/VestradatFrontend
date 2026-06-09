import { NextRequest } from 'next/server';
import { BASE_URL } from '@/config/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await request.json();
    
    // Validate the status field
    if (!body.status || !['active', 'inactive'].includes(body.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Status is required and must be either "active" or "inactive".',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Call the actual backend API
    const response = await fetch(`${BASE_URL}/api/subscription-packages/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...request.headers.has('authorization') 
          ? { authorization: request.headers.get('authorization')! } 
          : {},
      },
      body: JSON.stringify(body),
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
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error updating subscription package status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update subscription package status',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}