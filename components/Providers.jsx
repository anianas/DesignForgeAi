'use client';

import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
