import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'draft' | 'scheduled' | 'published' | 'active' | 'completed' | 'expired' | 'success' | 'warning' | 'error' | 'info' | 'default' | 'cancelled' | 'archived' | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-300',
    expired: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-300',
    archived: 'bg-orange-50 text-orange-700 border-orange-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    default: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
