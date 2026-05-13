import jwt from 'jsonwebtoken';
import { projects } from './store';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRY = '7d';

export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

export const jsonResponse = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });

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

/** Returns the public-safe subset of a user document. */
export const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  plan: user.plan,
});

/**
 * Fetches a project and verifies the caller owns it.
 * Returns { project, error } — if error is non-null it is a ready Response to return.
 */
export const fetchOwnedProject = async (projectId, userId) => {
  const project = await projects.get(projectId);
  if (!project) return { project: null, error: jsonResponse({ error: 'Project not found' }, 404) };
  if (project.userId !== userId) return { project: null, error: jsonResponse({ error: 'Access denied' }, 403) };
  return { project, error: null };
};
