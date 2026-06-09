import { NextRequest } from 'next/server';
import { BASE_URL } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    // Call the actual backend API
    const backendUrl = `${BASE_URL}/api/super-admin/location-verifications/rejected`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...request.headers.has('authorization') 
          ? { authorization: request.headers.get('authorization')! } 
          : {},
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      return new Response(errorText, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching rejected locations:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch rejected locations',
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