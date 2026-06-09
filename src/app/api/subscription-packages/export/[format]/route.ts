import { NextRequest } from 'next/server';
import { BASE_URL } from '@/config/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ format: string }> }) {
  try {
    const awaitedParams = await params;
    const { format } = awaitedParams;
    
    // Validate format
    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Format must be one of: csv, excel, pdf',
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
    const backendUrl = `${BASE_URL}/api/subscription-packages/export/${format}`;
    
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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Return the response from the backend
    const blob = await response.blob();
    
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename=subscription-packages.${format}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error exporting subscription packages:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to export subscription packages',
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