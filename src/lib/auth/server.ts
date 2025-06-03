
// lib/auth/server.ts
import 'server-only';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/cookies';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import type { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE_NAME = '__session';
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSessionCookie(idToken: string): Promise<void> {
  console.log('[AuthServer createSessionCookie] Attempting to create session cookie...');
  try {
    // Verify the ID token while checking if the token is revoked by passing true.
    console.log('[AuthServer createSessionCookie] Verifying ID token...');
    const decodedIdToken = await adminAuth.verifyIdToken(idToken, true /** checkRevoked */);
    console.log('[AuthServer createSessionCookie] ID token VERIFIED. UID:', decodedIdToken.uid, 'Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString());

    // Only process if the auth time is recent (e.g., within the last 5 minutes)
    // to prevent replay attacks if the ID token is intercepted.
    // This is a security measure.
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      console.log('[AuthServer createSessionCookie] Auth time is recent. Creating session cookie...');
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      const options = {
        name: SESSION_COOKIE_NAME,
        value: sessionCookie,
        maxAge: expiresIn / 1000, // maxAge is in seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        path: '/', // Cookie available for all paths
        sameSite: 'lax' as const, // CSRF protection
      };
      cookies().set(options);
      console.log('[AuthServer createSessionCookie] Session cookie CREATED and SET successfully.');
    } else {
      console.warn('[AuthServer createSessionCookie] ID token is too old for session cookie creation. Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString(), 'Current time:', new Date().toISOString());
      throw new Error('Recent sign-in required. ID token is too old.');
    }
  } catch (error: any) {
    console.error('[AuthServer createSessionCookie] Error in createSessionCookie:', error.message, error.code ? `(Code: ${error.code})` : '');
    // Rethrow the error so the calling API route can handle it
    throw error;
  }
}

export async function clearSessionCookie(): Promise<void> {
  console.log('[AuthServer clearSessionCookie] Clearing session cookie...');
  try {
    cookies().delete(SESSION_COOKIE_NAME);
    console.log('[AuthServer clearSessionCookie] Session cookie cleared successfully.');
  } catch (error: any) {
    console.error('[AuthServer clearSessionCookie] Error clearing session cookie:', error.message);
    throw error;
  }
}

// getCurrentUser is called by server components
export async function getCurrentUser(cookieStoreInstance?: ReadonlyRequestCookies): Promise<DecodedIdToken | null> {
  console.log('[AuthServer DEBUG getCurrentUser] Function called.');
  const currentCookies = cookieStoreInstance || cookies();
  let sessionCookieValue: string | undefined;

  try {
    const sessionCookie = currentCookies.get(SESSION_COOKIE_NAME);
    sessionCookieValue = sessionCookie?.value;

    if (sessionCookieValue) {
      console.log('[AuthServer DEBUG getCurrentUser] Session cookie FOUND (first 10 chars):', sessionCookieValue.substring(0, 10) + '...');
    } else {
      console.log('[AuthServer DEBUG getCurrentUser] Session cookie NOT FOUND using cookie store.');
      return null;
    }
  } catch (error: any) {
    console.error('[AuthServer DEBUG getCurrentUser] Error accessing cookie from store:', error.message);
    return null; // If we can't even read the cookie, assume no user
  }

  try {
    console.log('[AuthServer DEBUG getCurrentUser] Verifying session cookie...');
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookieValue, true /** checkRevoked */);
    console.log('[AuthServer DEBUG getCurrentUser] Session cookie VERIFIED. UID:', decodedIdToken.uid);
    return decodedIdToken;
  } catch (error: any)
{
    console.error('[AuthServer DEBUG getCurrentUser] Session cookie verification FAILED:', error.message, error.code ? `(Code: ${error.code})` : '');
    // If verification fails, clear the invalid/expired cookie if we're using the default store
    if (!cookieStoreInstance) {
        console.log('[AuthServer DEBUG getCurrentUser] Clearing invalid/expired session cookie (default store).');
        cookies().delete(SESSION_COOKIE_NAME);
    }
    return null;
  }
}
