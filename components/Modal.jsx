'use client';

import { useEffect } from 'react';

const Modal = ({ open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;
