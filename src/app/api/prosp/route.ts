import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, apiKey, data } = body;

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Missing endpoint or apiKey' },
        { status: 400 }
      );
    }

    const baseUrl = 'https://prosp.ai/api/v1';
    const url = `${baseUrl}${endpoint}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: apiKey, ...(data || {}) }),
    });

    const responseData = await res.json();

    return NextResponse.json(responseData, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const apiKey = searchParams.get('apiKey');

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Missing endpoint or apiKey' },
        { status: 400 }
      );
    }

    const baseUrl = 'https://prosp.ai/api/v1';
    const url = `${baseUrl}${endpoint}?api_key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url);

    const responseData = await res.json();

    return NextResponse.json(responseData, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
