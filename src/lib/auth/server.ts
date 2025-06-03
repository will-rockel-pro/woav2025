
// lib/auth/server.ts
import 'server-only';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/cookies'; // For typing
import { cookies } from 'next/headers'; // Keep this for create/clear session cookie functions
import { adminAuth } from '@/lib/firebaseAdmin';
import type { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE_NAME = '__session';
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSessionCookie(idToken: string): Promise<void> {
  console.log('[AuthServer] Attempting to create session cookie...');
  try {
    const decodedIdToken = await adminAuth.verifyIdToken(idToken, true /** checkRevoked */);
    console.log('[AuthServer] ID token verified. Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString());

    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      const options = {
        name: SESSION_COOKIE_NAME,
        value: sessionCookie,
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax' as const,
      };
      cookies().set(options);
      console.log('[AuthServer] Session cookie created and set successfully.');
    } else {
      console.warn('[AuthServer] ID token is too old for session cookie creation. Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString(), 'Current time:', new Date().toISOString());
      throw new Error('ID token too old, re-authentication required for session cookie.');
    }
  } catch (error: any) {
    console.error('[AuthServer] Error in createSessionCookie:', error.message, error.code ? `(Code: ${error.code})` : '');
    throw error;
  }
}

export async function clearSessionCookie(): Promise<void> {
  console.log('[AuthServer] Clearing session cookie...');
  cookies().delete(SESSION_COOKIE_NAME);
  console.log('[AuthServer] Session cookie cleared.');
}

// Modified function to accept cookieStore
export async function getCurrentUser(cookieStoreInstance?: ReadonlyRequestCookies): Promise<DecodedIdToken | null> {
  console.log('[AuthServer DEBUG] getCurrentUser called.');
  const storeToUse = cookieStoreInstance || cookies(); // Use passed store or default
  let sessionCookieValue: string | undefined;

  try {
    const sessionCookie = storeToUse.get(SESSION_COOKIE_NAME);
    sessionCookieValue = sessionCookie?.value;
    if (sessionCookieValue) {
      console.log('[AuthServer DEBUG] Session cookie FOUND in store. Value (first 10 chars):', sessionCookieValue.substring(0, 10) + '...');
    } else {
      console.log('[AuthServer DEBUG] Session cookie NOT FOUND in store.');
      return null;
    }
  } catch (e: any) {
    console.error('[AuthServer DEBUG] Error accessing cookie from store:', e.message);
    return null;
  }

  try {
    console.log('[AuthServer DEBUG] Verifying session cookie from store...');
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookieValue, true /** checkRevoked */);
    console.log('[AuthServer DEBUG] Session cookie VERIFIED successfully from store. UID:', decodedIdToken.uid);
    return decodedIdToken;
  } catch (error: any) {
    console.error('[AuthServer DEBUG] Error VERIFYING session cookie from store:', error.message, error.code ? `(Code: ${error.code})` : '');
    // Do not clear cookie here if store was passed, let the caller handle it or clear it via the standard cookies()
    if (!cookieStoreInstance) {
        console.log('[AuthServer DEBUG] Clearing invalid/expired session cookie (when using internal cookies() call).');
        cookies().delete(SESSION_COOKIE_NAME);
    }
    return null;
  }
}
