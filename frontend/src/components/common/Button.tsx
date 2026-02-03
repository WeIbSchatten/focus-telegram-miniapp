'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'kids' | 'sense' | 'outline' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white font-semibold rounded-lg px-6 py-2.5 shadow-soft hover:opacity-95 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
  kids:
    'bg-kids text-gray-900 font-semibold rounded-lg px-6 py-2.5 shadow-soft hover:opacity-95 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-kids/60 focus-visible:ring-offset-2',
  sense:
    'bg-sense text-white font-semibold rounded-lg px-6 py-2.5 shadow-[var(--shadow-sense)] hover:opacity-95 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sense/60 focus-visible:ring-offset-2',
  outline:
    'border-2 border-primary text-primary font-semibold rounded-lg px-6 py-2.5 hover:bg-primary/5 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
  ghost:
    'text-primary font-medium hover:bg-primary/10 rounded-lg px-4 py-2 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
};

export function Button({
  variant = 'primary',
  children,
  className = '',
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
}
