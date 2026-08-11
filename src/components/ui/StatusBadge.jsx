import React from 'react';

export const StatusBadge = ({ status, label }) => {
  let colorClass = 'bg-status-active/20 text-status-active border-status-active/50';
  let dotClass = 'bg-status-active';
  let defaultLabel = 'Ativo';

  if (status === 'inactive' || status === false) {
    colorClass = 'bg-status-inactive/20 text-status-inactive border-status-inactive/50';
    dotClass = 'bg-status-inactive';
    defaultLabel = 'Inativo';
  } else if (status === 'warning') {
    colorClass = 'bg-status-warning/20 text-status-warning border-status-warning/50';
    dotClass = 'bg-status-warning';
    defaultLabel = 'Atenção';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
      {label || defaultLabel}
    </span>
  );
};

export default StatusBadge;