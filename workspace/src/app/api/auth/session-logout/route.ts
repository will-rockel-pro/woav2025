
// src/app/api/auth/session-logout/route.ts
import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUser } from '@/lib/auth/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST() {
  try {
    const currentUser = await getCurrentUser(); // Get user from session cookie
    if (currentUser && currentUser.uid) {
      // Optional: Revoke refresh tokens. This invalidates all sessions for the user.
      // Be cautious with this as it logs the user out from all devices.
      // await adminAuth.revokeRefreshTokens(currentUser.uid);
    }
    await clearSessionCookie();
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Session logout error:', error);
    return NextResponse.json({ error: error.message || 'Failed to clear session' }, { status: 500 });
  }
}
