
// lib/auth/server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin'; // Use admin SDK
import type { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE_NAME = '__session';
// Consider making expiresIn configurable or longer for production
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSessionCookie(idToken: string): Promise<void> {
  const decodedIdToken = await adminAuth.verifyIdToken(idToken, true /** checkRevoked */);
  
  // Only process if the user just signed in in the last 5 minutes.
  if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const options = {
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      path: '/',
      sameSite: 'lax' as const,
    };
    cookies().set(options);
  } else {
    // User did not sign in recently. To guard against ID token theft, require re-authentication.
    // This is a security measure.
    console.warn('ID token is too old. Please re-authenticate.');
    // You might want to throw an error or handle this case specifically in the API route.
    throw new Error('ID token too old, re-authentication required.');
  }
}

export async function clearSessionCookie(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<DecodedIdToken | null> {
  const sessionCookieValue = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookieValue) {
    return null;
  }

  try {
    // Verify the session cookie. In this case an additional check is added to detect
    // if the user's Firebase session was revoked, user deleted/disabled, etc.
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookieValue, true /** checkRevoked */);
    return decodedIdToken;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    // Session cookie is invalid or expired. Clear it.
    await clearSessionCookie();
    return null;
  }
}
