import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const headers: HeadersInit = new Headers();
        req.headers.forEach((value, key) => headers.append(key, value));
        headers.set('Content-Type', 'application/json');

        const body = await req.json();

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sdfgsdfg.net';
        const response = await fetch(`${backendUrl}/test`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json({ message: 'Error fetching data' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
    }
}
