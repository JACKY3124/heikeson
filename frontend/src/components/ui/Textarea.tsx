import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = ({
  label,
  error,
  className = '',
  ...props
}: TextareaProps) => {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <textarea
        className={`w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 placeholder-slate-500 resize-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default Textarea;
