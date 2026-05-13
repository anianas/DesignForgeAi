'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';
import Navbar from '@/components/Navbar';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const AuthHeader = ({ mode }) => (
  <div className="text-center mb-8">
    <h1
      className="serif"
      style={{ fontSize: 44, letterSpacing: '-0.02em', marginBottom: 8 }}
    >
      {mode === 'login' ? 'Welcome back' : 'Create your account'}
    </h1>
    <p className="text-muted">
      {mode === 'login'
        ? 'Log in to continue to your projects.'
        : 'Start turning ideas into B2B product concepts.'}
    </p>
  </div>
);

const FormField = ({ id, label, error, helper, children }) => (
  <div className={`field ${error ? 'has-error' : ''}`}>
    <label htmlFor={id}>{label}</label>
    {children}
    {error && <span className="field-error">{error}</span>}
    {!error && helper && <span className="field-helper">{helper}</span>}
  </div>
);

const ModeToggle = ({ mode, onToggle }) => (
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
        onClick={onToggle}
        style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'underline' }}
      >
        {mode === 'login' ? 'Create an account' : 'Log in instead'}
      </button>
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export default function AuthForm() {
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
    const fieldErrors = {};
    if (mode === 'signup' && form.name.trim().length < 2) fieldErrors.name = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) fieldErrors.email = 'Enter a valid email address';
    if (form.password.length < 8) fieldErrors.password = 'Password must be at least 8 characters';
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleSubmit = async (ev) => {
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

  const handleFieldChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
  };

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
          <AuthHeader mode={mode} />

          <div className="card">
            <form onSubmit={handleSubmit} noValidate>
              {mode === 'signup' && (
                <FormField id="name" label="Name" error={errors.name}>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={handleFieldChange('name')}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </FormField>
              )}

              <FormField id="email" label="Email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleFieldChange('email')}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </FormField>

              <FormField
                id="password"
                label="Password"
                error={errors.password}
                helper={mode === 'signup' ? 'Use 8+ characters with a mix of letters and numbers.' : undefined}
              >
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleFieldChange('password')}
                  placeholder="At least 8 characters"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </FormField>

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg mt-4"
                disabled={submitting}
              >
                {submitting ? (
                  <><span className="spinner" /> Working…</>
                ) : mode === 'login' ? (
                  'Log in →'
                ) : (
                  'Create free account →'
                )}
              </button>
            </form>

            <ModeToggle mode={mode} onToggle={handleToggleMode} />
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
