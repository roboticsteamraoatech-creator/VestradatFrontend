import { NextRequest } from 'next/server';
import { BASE_URL } from '@/config/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    
    // Call the actual backend API
    const backendUrl = `${BASE_URL}/api/subscription-packages/${id}`;
    
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
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching subscription package:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch subscription package',
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await request.json();
    
    // Validate services array if provided
    if (body.services && Array.isArray(body.services)) {
      for (const service of body.services) {
        if (!service.serviceId || !service.duration) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Each service must have serviceId and duration fields.',
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

        // Validate duration
        if (!['monthly', 'quarterly', 'yearly'].includes(service.duration)) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Service duration must be one of: monthly, quarterly, yearly',
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
      }
    }

    // Validate discount percentage if provided
    if (body.discountPercentage !== undefined && (body.discountPercentage < 0 || body.discountPercentage > 100)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Discount percentage must be between 0 and 100.',
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

    // Validate promo dates if provided
    if (body.promoStartDate && body.promoEndDate) {
      const startDate = new Date(body.promoStartDate);
      const endDate = new Date(body.promoEndDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid date format for promo start or end date.',
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

      if (startDate > endDate) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Promo start date must be before end date.',
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
    }

    // Call the actual backend API
    const response = await fetch(`${BASE_URL}/api/subscription-packages/${id}`, {
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
    console.error('Error updating subscription package:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update subscription package',
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    
    // Call the actual backend API
    const response = await fetch(`${BASE_URL}/api/subscription-packages/${id}`, {
      method: 'DELETE',
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
    console.error('Error deleting subscription package:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to delete subscription package',
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