import type { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

const Table = ({ children, className = '' }: TableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
};

interface TheadProps {
  children: ReactNode;
}

const Thead = ({ children }: TheadProps) => {
  return (
    <thead className="bg-slate-800">
      {children}
    </thead>
  );
};

interface TbodyProps {
  children: ReactNode;
}

const Tbody = ({ children }: TbodyProps) => {
  return <tbody className="divide-y divide-slate-700">{children}</tbody>;
};

interface TrProps {
  children: ReactNode;
  className?: string;
}

const Tr = ({ children, className = '' }: TrProps) => {
  return (
    <tr className={`hover:bg-slate-700/50 transition-colors ${className}`}>
      {children}
    </tr>
  );
};

interface ThProps {
  children: ReactNode;
  className?: string;
}

const Th = ({ children, className = '' }: ThProps) => {
  return (
    <th className={`px-4 py-3 text-sm font-semibold text-slate-300 ${className}`}>
      {children}
    </th>
  );
};

interface TdProps {
  children: ReactNode;
  className?: string;
}

const Td = ({ children, className = '' }: TdProps) => {
  return (
    <td className={`px-4 py-3 text-sm text-slate-300 ${className}`}>
      {children}
    </td>
  );
};

Table.Thead = Thead;
Table.Tbody = Tbody;
Table.Tr = Tr;
Table.Th = Th;
Table.Td = Td;

export default Table;
