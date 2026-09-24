import React from 'react';

const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold font-display text-stone-900">{title}</h1>
      {subtitle && <p className="text-stone-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-3">{action}</div>}
  </div>
);

export default PageHeader;
