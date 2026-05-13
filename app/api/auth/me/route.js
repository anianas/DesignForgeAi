import { users } from '@/lib/store';
import { requireUser, jsonResponse, serializeUser } from '@/lib/auth';

export async function GET(req) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const storedUser = await users.get(user.email);
  if (!storedUser) return jsonResponse({ error: 'User not found' }, 404);

  return jsonResponse({ user: serializeUser(storedUser) });
}
