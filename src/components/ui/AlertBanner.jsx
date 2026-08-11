import React from 'react';
import { AlertCircle } from 'lucide-react';

export const AlertBanner = ({ title, message, type = 'warning' }) => {
  let colors = 'bg-status-warning/10 text-status-warning border-status-warning/20';
  if (type === 'error') colors = 'bg-status-inactive/10 text-status-inactive border-status-inactive/20';
  if (type === 'success') colors = 'bg-status-active/10 text-status-active border-status-active/20';

  return (
    <div className={`flex items-start p-4 mb-4 border rounded-lg ${colors}`}>
      <AlertCircle className="w-5 h-5 mt-0.5 mr-3 shrink-0" />
      <div>
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        <p className="text-sm mt-1 opacity-90">{message}</p>
      </div>
    </div>
  );
};

export default AlertBanner;