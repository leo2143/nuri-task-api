export const AUTH_COOKIE_NAME = 'nuri_auth';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Cookie cross-site en Vercel/prod (app y API son sitios distintos).
 */
function isCrossSiteCookie() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

/**
 * Opciones compartidas para set y clear (mismo path/sameSite/secure).
 */
export function getAuthCookieOptions() {
  const crossSite = isCrossSiteCookie();
  return {
    httpOnly: true,
    path: '/',
    maxAge: MAX_AGE_MS,
    secure: crossSite,
    sameSite: crossSite ? 'none' : 'lax',
  };
}

/**
 * Setea la cookie HttpOnly con el JWT.
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

/**
 * Limpia la cookie de sesión.
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  const { maxAge: _maxAge, ...options } = getAuthCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, options);
}

/**
 * Lee el JWT de la cookie o del header Authorization.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export function readAuthToken(req) {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const parts = header.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

/**
 * Pone el JWT en cookie y lo saca del body JSON.
 * @param {import('express').Response} res
 * @param {Object} result
 * @returns {Object}
 */
export function attachAuthCookie(res, result) {
  if (result.success && result.data?.token) {
    setAuthCookie(res, result.data.token);
    delete result.data.token;
  }
  return result;
}
