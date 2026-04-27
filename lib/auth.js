import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRY = '7d';

export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

// Read JWT from the Authorization: Bearer header on a Next.js Request.
// Returns the decoded payload or null. Never throws.
export const verifyRequest = (req) => {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const requireUser = (req) => {
  const user = verifyRequest(req);
  if (!user) {
    return {
      user: null,
      response: jsonResponse({ error: 'Authentication required' }, 401),
    };
  }
  return { user, response: null };
};

export const jsonResponse = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
