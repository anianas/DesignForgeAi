import bcrypt from 'bcryptjs';
import { users } from '@/lib/store';
import { signToken, jsonResponse } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return jsonResponse({ error: 'Email and password are required' }, 400);
  }
  const user = await users.get(email);
  if (!user) return jsonResponse({ error: 'Invalid credentials' }, 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return jsonResponse({ error: 'Invalid credentials' }, 401);

  const token = signToken({ userId: user.id, email: user.email });
  return jsonResponse({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
  });
}
