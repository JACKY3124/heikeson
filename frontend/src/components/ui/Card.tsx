import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

const CardHeader = ({ children, className = '' }: CardHeaderProps) => {
  return (
    <div className={`px-6 py-4 border-b border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

const CardFooter = ({ children, className = '' }: CardFooterProps) => {
  return (
    <div className={`px-6 py-4 border-t border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
