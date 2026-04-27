import { users } from '@/lib/store';
import { requireUser, jsonResponse } from '@/lib/auth';

export async function GET(req) {
  const { user, response } = requireUser(req);
  if (response) return response;

  const stored = await users.get(user.email);
  if (!stored) return jsonResponse({ error: 'User not found' }, 404);

  return jsonResponse({
    user: {
      id: stored.id,
      name: stored.name,
      email: stored.email,
      plan: stored.plan,
    },
  });
}
