'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-white p-6 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="mb-4 text-xl font-bold text-primary">{title}</h3>
        )}
        {children}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border-2 border-primary/30 py-2 font-medium text-primary hover:bg-primary/5"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
