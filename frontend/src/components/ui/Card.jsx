import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-2xl shadow-card border border-stone-100 w-full overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6 pb-4 ${className}`}>
    <div className="min-w-0 flex-1">
      <h2 className="text-lg font-bold font-display text-stone-900 truncate">{title}</h2>
      {subtitle && <p className="text-sm text-stone-500 mt-0.5 break-words">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`px-4 sm:px-6 pb-4 sm:pb-6 w-full ${className}`}>{children}</div>
);

export default Card;