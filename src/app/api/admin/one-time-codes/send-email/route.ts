import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL } from '@/config/api';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📧 Sending one-time code via email:', body);

    
    const backendUrl = BASE_URL;
    
   
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(`${backendUrl}/admin/one-time-codes/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

  
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Email sending proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to send one-time code via email', error: String(error) },
      { status: 500 }
    );
  }
}