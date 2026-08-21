import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
