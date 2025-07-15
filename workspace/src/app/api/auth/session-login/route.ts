
// src/app/api/auth/session-login/route.ts
import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth/server';
import { adminAuth } from '@/lib/firebaseAdmin'; // Ensure adminAuth is initialized

export async function POST(request: Request) {
  console.log('[API /api/auth/session-login] Received POST request.');
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      console.error('[API /api/auth/session-login] ID token is missing in request body.');
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }
    console.log('[API /api/auth/session-login] ID token received (first 10 chars):', idToken.substring(0, 10));

    // Basic check if adminAuth is available
    if (!adminAuth) {
        console.error('[API /api/auth/session-login] Firebase Admin SDK (adminAuth) is not initialized! This is a critical server configuration issue. The `firebaseAdmin.ts` file might have failed to initialize it, possibly due to missing or incorrect service account key JSON.');
        return NextResponse.json({ error: 'Server configuration error. Admin SDK not available.' }, { status: 500 });
    }
    console.log('[API /api/auth/session-login] Firebase Admin SDK (adminAuth) appears to be available.');

    await createSessionCookie(idToken);
    console.log('[API /api/auth/session-login] Session cookie creation process completed by createSessionCookie.');
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/auth/session-login] Error during session login:', error.message, error.code ? `(Code: ${error.code})` : '');
    return NextResponse.json({ error: error.message || 'Failed to create session' }, { status: 500 });
  }
}
