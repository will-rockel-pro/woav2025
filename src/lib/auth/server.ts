
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
    console.log('[AuthServer createSessionCookie] Verifying ID token (first 10 chars):', idToken.substring(0, 10) + '...');
    let decodedIdToken;
    try {
      decodedIdToken = await adminAuth.verifyIdToken(idToken, true /** checkRevoked */);
      console.log('[AuthServer createSessionCookie] ID token VERIFIED. UID:', decodedIdToken.uid, 'Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString());
    } catch (verifyError: any) {
      console.error('[AuthServer createSessionCookie] Error VERIFYING ID token:', verifyError.message, verifyError.code ? `(Code: ${verifyError.code})` : '', verifyError.stack);
      throw new Error(`ID token verification failed: ${verifyError.message}`);
    }

    // Only process if the auth time is recent (e.g., within the last 5 minutes)
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
      console.log('[AuthServer createSessionCookie] Auth time is recent. Creating session cookie string...');
      let sessionCookie;
      try {
        sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        console.log('[AuthServer createSessionCookie] Session cookie string CREATED (first 10 chars):', sessionCookie.substring(0,10) + '...');
      } catch (createCookieError: any) {
        console.error('[AuthServer createSessionCookie] Error CREATING session cookie string:', createCookieError.message, createCookieError.code ? `(Code: ${createCookieError.code})` : '', createCookieError.stack);
        throw new Error(`Session cookie string creation failed: ${createCookieError.message}`);
      }

      const options = {
        name: SESSION_COOKIE_NAME,
        value: sessionCookie,
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax' as const,
      };
      try {
        // Ensure cookies() is available. This check is more for robustness.
        if (typeof cookies === 'function') {
            cookies().set(options);
            console.log('[AuthServer createSessionCookie] Session cookie SET in browser options:', options);
        } else {
            console.error('[AuthServer createSessionCookie] cookies() function is not available in this context. Cannot set cookie.');
            throw new Error('Failed to set cookie: cookies() function unavailable.');
        }
      } catch (setCookieError: any) {
         console.error('[AuthServer createSessionCookie] Error SETTING cookie via cookies().set():', setCookieError.message, setCookieError.stack);
         throw new Error(`Setting cookie in browser failed: ${setCookieError.message}`);
      }
    } else {
      console.warn('[AuthServer createSessionCookie] ID token is too old for session cookie creation. Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString(), 'Current time:', new Date().toISOString());
      throw new Error('Recent sign-in required. ID token is too old.');
    }
  } catch (error: any) {
    // This will catch errors re-thrown from the inner blocks or any other synchronous error
    console.error('[AuthServer createSessionCookie] Overall error in createSessionCookie:', error.message, error.code ? `(Code: ${error.code})` : '', error.stack);
    throw error; // Re-throw the caught error to be handled by the API route
  }
}

export async function clearSessionCookie(): Promise<void> {
  console.log('[AuthServer clearSessionCookie] Clearing session cookie...');
  try {
    if (typeof cookies === 'function') {
        cookies().delete(SESSION_COOKIE_NAME);
        console.log('[AuthServer clearSessionCookie] Session cookie cleared successfully.');
    } else {
        console.error('[AuthServer clearSessionCookie] cookies() function is not available. Cannot clear cookie.');
    }
  } catch (error: any) {
    console.error('[AuthServer clearSessionCookie] Error clearing session cookie:', error.message);
    throw error;
  }
}

export async function getCurrentUser(cookieStoreInstance?: ReadonlyRequestCookies): Promise<DecodedIdToken | null> {
  const currentCookies = cookieStoreInstance || (typeof cookies === 'function' ? cookies() : null);
  console.log('[AuthServer DEBUG getCurrentUser] Function called.');

  if (!currentCookies) {
    console.warn('[AuthServer DEBUG getCurrentUser] Cookie store (cookies() or provided instance) is not available.');
    return null;
  }

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
    console.error('[AuthServer DEBUG getCurrentUser] Error accessing cookie from store:', error.message, error.stack);
    return null;
  }

  try {
    console.log('[AuthServer DEBUG getCurrentUser] Verifying session cookie value...');
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookieValue, true /** checkRevoked */);
    console.log('[AuthServer DEBUG getCurrentUser] Session cookie VERIFIED. UID:', decodedIdToken.uid);
    return decodedIdToken;
  } catch (error: any) {
    console.error('[AuthServer DEBUG getCurrentUser] Session cookie verification FAILED:', error.message, error.code ? `(Code: ${error.code})` : '', error.stack);
    if (!cookieStoreInstance && typeof cookies === 'function') {
        console.log('[AuthServer DEBUG getCurrentUser] Clearing invalid/expired session cookie (default store).');
        cookies().delete(SESSION_COOKIE_NAME);
    }
    return null;
  }
}
