/**
 * Lightweight JWT implementation using Node.js built-in crypto module.
 * Implements HS256 (HMAC-SHA256) signing and verification.
 * No external dependencies required.
 */
import crypto from 'crypto';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  clinicId?: string;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function createSignature(header: string, payload: string, secret: string): string {
  const data = `${header}.${payload}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sign a JWT token with the given payload and secret.
 * Token expires in 7 days by default.
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInSeconds: number = 7 * 24 * 60 * 60): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = createSignature(header, encodedPayload, secret);

  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a JWT token.
 * Returns the decoded payload on success, or null if invalid/expired.
 */
export function verifyToken(token: string, secret: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    // Verify signature
    const expectedSignature = createSignature(header, payload, secret);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    // Decode payload
    const decoded: JWTPayload = JSON.parse(base64UrlDecode(payload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
