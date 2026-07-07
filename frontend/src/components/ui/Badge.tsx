import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge = ({
  children,
  variant = 'secondary',
  size = 'sm',
  className = '',
}: BadgeProps) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variantStyles = {
    primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    secondary: 'bg-slate-700 text-slate-300 border border-slate-600',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
