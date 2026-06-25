/**
 * Express middleware for JWT-based authentication and role-based authorization.
 */
import { verifyToken, JWTPayload } from './jwt.js';

export interface AuthenticatedRequest {
  user?: JWTPayload;
  headers: any;
  body: any;
  params: any;
  query: any;
  [key: string]: any;
}

/**
 * Middleware that validates the JWT Bearer token from the Authorization header.
 * Attaches the decoded user payload to req.user on success.
 */
export function authenticateToken(req: any, res: any, next: any): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please log in.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set.' });
    return;
  }

  const decoded = verifyToken(token, secret);
  if (!decoded) {
    res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
    return;
  }

  req.user = decoded;
  next();
}

/**
 * Middleware factory that restricts access to specific roles.
 * Must be used AFTER authenticateToken.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: any, res: any, next: any): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
      return;
    }

    next();
  };
}
