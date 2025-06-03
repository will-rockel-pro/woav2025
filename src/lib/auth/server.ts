
// lib/auth/server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin'; // Use admin SDK
import type { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_COOKIE_NAME = '__session';
// Consider making expiresIn configurable or longer for production
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSessionCookie(idToken: string): Promise<void> {
  console.log('[AuthServer] Attempting to create session cookie...');
  try {
    const decodedIdToken = await adminAuth.verifyIdToken(idToken, true /** checkRevoked */);
    console.log('[AuthServer] ID token verified. Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString());

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
      // Use the Next.js cookies() utility to set the cookie
      cookies().set(options);
      console.log('[AuthServer] Session cookie created and set successfully.');
    } else {
      console.warn('[AuthServer] ID token is too old for session cookie creation. Auth time:', new Date(decodedIdToken.auth_time * 1000).toISOString(), 'Current time:', new Date().toISOString());
      throw new Error('ID token too old, re-authentication required for session cookie.');
    }
  } catch (error: any) {
    console.error('[AuthServer] Error in createSessionCookie:', error.message, error.code ? `(Code: ${error.code})` : '');
    // Re-throw the error so the API route can handle it
    throw error;
  }
}

export async function clearSessionCookie(): Promise<void> {
  console.log('[AuthServer] Clearing session cookie...');
  // Use the Next.js cookies() utility to delete the cookie
  cookies().delete(SESSION_COOKIE_NAME);
  console.log('[AuthServer] Session cookie cleared.');
}

export async function getCurrentUser(): Promise<DecodedIdToken | null> {
  console.log('[AuthServer] Attempting to get current user from session cookie...');
  let sessionCookieValue: string | undefined;

  try {
    // Directly get the cookie store and then the specific cookie.
    // This pattern is standard for 'next/headers'.
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    sessionCookieValue = sessionCookie?.value;
  } catch (e: any) {
    // This catch block is for errors during the act of trying to read cookies,
    // which is less common than verification errors but good to have.
    console.error('[AuthServer] Error accessing cookies from store:', e.message);
    return null;
  }
  

  if (!sessionCookieValue) {
    console.log('[AuthServer] No session cookie found (value is missing).');
    return null;
  }
  
  console.log('[AuthServer] Session cookie found. Value (first 10 chars):', sessionCookieValue.substring(0, 10) + '...');

  try {
    console.log('[AuthServer] Verifying session cookie...');
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookieValue, true /** checkRevoked */);
    console.log('[AuthServer] Session cookie verified successfully. UID:', decodedIdToken.uid);
    return decodedIdToken;
  } catch (error: any) {
    console.error('[AuthServer] Error verifying session cookie:', error.message, error.code ? `(Code: ${error.code})` : '');
    // Session cookie is invalid or expired. Clear it.
    console.log('[AuthServer] Clearing invalid/expired session cookie due to verification error.');
    // No await needed here as clearSessionCookie itself will handle the async nature of cookies().delete()
    // if it were to be made async, but cookies().delete() is synchronous.
    cookies().delete(SESSION_COOKIE_NAME); // Directly clear
    return null;
  }
}
