import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
}

const Empty = ({ icon, title, description }: EmptyProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon || <Inbox className="h-16 w-16 text-slate-600 mb-4" />}
      {title && <h3 className="text-lg font-medium text-slate-400 mb-2">{title}</h3>}
      {description && <p className="text-slate-500 text-sm">{description}</p>}
    </div>
  );
};

export default Empty;
