import 'dotenv/config';
import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { getPool, sql } from './db.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser }
}

const tenantId = (process.env.ENTRA_TENANT_ID || 'f1dad057-a1be-4bcd-b374-50cba74582fd').trim();
const apiClientId = (process.env.ENTRA_CLIENT_ID || '').trim();
const configuredApiScope = (process.env.API_SCOPE || process.env.VITE_API_SCOPE || '').trim();
const configuredResource = configuredApiScope.match(/^api:\/\/([^/]+)/i)?.[1];
const audiences = [...new Set([
  apiClientId,
  apiClientId ? `api://${apiClientId}` : '',
  configuredResource,
  configuredResource ? `api://${configuredResource}` : '',
].filter(Boolean))];
const issuers = [
  `https://login.microsoftonline.com/${tenantId}/v2.0`,
  `https://sts.windows.net/${tenantId}/`,
];
const jwks = createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`));

const claim = (payload: JWTPayload, key: string): string | undefined => {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !apiClientId) return res.status(401).json({ error: 'Missing authentication configuration or token' });
  let id: string | undefined;
  let email: string;
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: issuers, audience: audiences });
    id = claim(payload, 'oid')
      || claim(payload, 'sub')
      || claim(payload, 'http://schemas.microsoft.com/identity/claims/objectidentifier');
    email = (
      claim(payload, 'preferred_username')
      || claim(payload, 'email')
      || claim(payload, 'upn')
      || claim(payload, 'unique_name')
      || claim(payload, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress')
      || claim(payload, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn')
      || ''
    ).toLowerCase();
    if (!id || !email) return res.status(401).json({ error: 'Token has no usable user identity' });
  } catch (error) {
    console.error('Entra token validation failed', error instanceof Error ? `${error.name}: ${error.message}` : error);
    return res.status(401).json({ error: 'Invalid Microsoft Entra access token' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request().input('id', sql.NVarChar(128), id).input('email', sql.NVarChar(320), email)
      .query(`MERGE dbo.Users AS target USING (SELECT @id AS Id, @email AS Email) AS source ON target.Id = source.Id
        WHEN MATCHED THEN UPDATE SET Email = source.Email, UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (Id, Email, DisplayName) VALUES (source.Id, source.Email, source.Email);`);
    void result;
    const userResult = await pool.request().input('id', sql.NVarChar(128), id).query('SELECT Id, Email, DisplayName, IsAdmin FROM dbo.Users WHERE Id = @id');
    const user = userResult.recordset[0];
    req.user = { id: user.Id, email: user.Email, name: user.DisplayName || user.Email, isAdmin: Boolean(user.IsAdmin) || user.Email === (process.env.ADMIN_EMAIL || 'itadmin@thaisummit.ind.in').trim() };
    next();
  } catch (error) {
    console.error('Authenticated user lookup failed', error);
    return res.status(503).json({ error: 'Unable to load the authenticated user from the database.' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Administrator access required' });
  next();
};
