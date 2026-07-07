import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = ({
  label,
  error,
  className = '',
  children,
  ...props
}: SelectProps) => {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        <select
          className={`appearance-none w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 pr-10 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 cursor-pointer ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default Select;
