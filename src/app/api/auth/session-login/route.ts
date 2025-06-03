
// src/app/api/auth/session-login/route.ts
import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth/server';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    await createSessionCookie(idToken);
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create session' }, { status: 500 });
  }
}
