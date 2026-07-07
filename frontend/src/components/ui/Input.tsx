import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const Input = ({
  label,
  error,
  prefix,
  suffix,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {prefix}
          </span>
        )}
        <input
          className={`w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 placeholder-slate-500 ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default Input;
