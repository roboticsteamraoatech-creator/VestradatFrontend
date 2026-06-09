import { NextRequest } from 'next/server';
import { BASE_URL } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100).toString(); // max limit 100
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || undefined;
    
    // Construct query parameters for the backend API
    const queryParams = new URLSearchParams();
    queryParams.set('page', page);
    queryParams.set('limit', limit);
    
    if (search) queryParams.set('search', search);
    if (sortBy) queryParams.set('sortBy', sortBy);
    if (sortOrder) queryParams.set('sortOrder', sortOrder);
    if (status) queryParams.set('status', status);
    
    // Call the actual backend API
    const backendUrl = `${BASE_URL}/api/subscription-packages?${queryParams.toString()}`;
    
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
        'Access-Control-Allow-Origin': '*', // Allow all origins during development
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching subscription packages:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch subscription packages',
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

export async function PUT(request: NextRequest) {
  // This route should not be used for bulk updates
  // Individual updates should use the /api/subscription-packages/[id] endpoint
  return new Response(
    JSON.stringify({
      success: false,
      message: 'Bulk update not supported. Use /api/subscription-packages/[id] for individual updates.',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.services || !Array.isArray(body.services) || body.services.length === 0 || !body.features || !Array.isArray(body.features) || body.features.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields: title, description, services (array with at least one item), and features (array with at least one item) are required.',
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

    // Validate services array
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
    const response = await fetch(`${BASE_URL}/api/subscription-packages`, {
      method: 'POST',
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
    console.error('Error creating subscription package:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create subscription package',
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