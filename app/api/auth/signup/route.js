import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { users } from '@/lib/store';
import { signToken, jsonResponse } from '@/lib/auth';

export async function POST(req) {
  const { name, email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return jsonResponse({ error: 'Email and password are required' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Invalid email' }, 400);
  }
  if (password.length < 8) {
    return jsonResponse({ error: 'Password must be at least 8 characters' }, 400);
  }
  if (await users.has(email)) {
    return jsonResponse({ error: 'An account with this email already exists' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: `usr_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
    name: name || email.split('@')[0],
    email,
    passwordHash,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };
  await users.set(email, user);

  const token = signToken({ userId: user.id, email: user.email });
  return jsonResponse({
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
  }, 201);
}
