'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';
import Navbar from '@/components/Navbar';

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { login, signup, isAuthenticated } = useAuth();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const validate = () => {
    const e = {};
    if (mode === 'signup' && form.name.trim().length < 2) e.name = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.show('Welcome back', 'success');
      } else {
        await signup(form.name, form.email, form.password);
        toast.show('Account created — welcome to DesignForge', 'success');
      }
      router.push('/dashboard');
    } catch (err) {
      toast.show(err.message || 'Authentication failed', 'error');
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="text-center mb-8">
            <h1 className="serif" style={{ fontSize: 44, letterSpacing: '-0.02em', marginBottom: 8 }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-muted">
              {mode === 'login'
                ? 'Log in to continue to your projects.'
                : 'Start turning ideas into B2B product concepts.'}
            </p>
          </div>

          <div className="card">
            <form onSubmit={onSubmit} noValidate>
              {mode === 'signup' && (
                <div className={`field ${errors.name ? 'has-error' : ''}`}>
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
              )}

              <div className={`field ${errors.email ? 'has-error' : ''}`}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className={`field ${errors.password ? 'has-error' : ''}`}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="At least 8 characters"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
                {!errors.password && mode === 'signup' && (
                  <span className="field-helper">
                    Use 8+ characters with a mix of letters and numbers.
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg mt-4"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" /> Working…
                  </>
                ) : mode === 'login' ? (
                  'Log in →'
                ) : (
                  'Create free account →'
                )}
              </button>
            </form>

            <div
              style={{
                borderTop: '1px solid var(--border)',
                marginTop: 24,
                paddingTop: 20,
                textAlign: 'center',
              }}
            >
              <p className="text-sm text-muted">
                {mode === 'login' ? 'New to DesignForge? ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setErrors({});
                  }}
                  style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'underline' }}
                >
                  {mode === 'login' ? 'Create an account' : 'Log in instead'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-xs text-dim text-center mt-6">
            Demo credentials: <span className="mono">demo@designforge.ai</span> ·{' '}
            <span className="mono">password123</span>
          </p>
        </div>
      </div>
    </>
  );
}
