'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="navbar">
      <Link href={user ? '/dashboard' : '/'} className="navbar-logo">
        <span className="navbar-logo-mark">DF</span>
        <span>
          DesignForge{' '}
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>AI</span>
        </span>
      </Link>
      <div className="navbar-nav">
        {user ? (
          <>
            <span className="text-sm text-muted" style={{ marginRight: 8 }}>
              {user.email}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/auth" className="btn btn-ghost btn-sm">
              Log in
            </Link>
            <Link href="/auth?mode=signup" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
