import bcrypt from 'bcryptjs';
import { users } from '@/lib/store';
import { signToken, jsonResponse, serializeUser } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return jsonResponse({ error: 'Email and password are required' }, 400);
  }

  const user = await users.get(email);
  if (!user) return jsonResponse({ error: 'Invalid credentials' }, 401);

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) return jsonResponse({ error: 'Invalid credentials' }, 401);

  const token = signToken({ userId: user.id, email: user.email });
  return jsonResponse({ token, user: serializeUser(user) });
}
