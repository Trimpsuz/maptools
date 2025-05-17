import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://cities.trimpsuz.dev/api/countries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: request.cache as RequestCache,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Error: ${errorText}`, status: response.status }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error proxying the request:', error);
    return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
  }
}
