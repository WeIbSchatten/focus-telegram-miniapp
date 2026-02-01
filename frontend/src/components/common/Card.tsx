'use client';

import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'kids';
  className?: string;
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const borderClass =
    variant === 'kids'
      ? 'border-2 border-kids shadow-soft'
      : 'border-2 border-primary/20 shadow-soft';
  return (
    <div
      className={`rounded-xl bg-white p-6 ${borderClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
