interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  inline?: boolean;
}

const Loading = ({ size = 'md', text, inline = false }: LoadingProps) => {
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  const textStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2 text-slate-400">
        <svg className={`animate-spin ${sizeStyles[size]} text-primary-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {text && <span className={textStyles[size]}>{text}</span>}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg className={`animate-spin ${sizeStyles[size]} text-primary-500 mb-4`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {text && <p className={`text-slate-400 ${textStyles[size]}`}>{text}</p>}
    </div>
  );
};

export default Loading;
