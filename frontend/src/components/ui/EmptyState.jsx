import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6 animate-fadeIn">
    <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-brand-500" strokeWidth={1.5} />
    </div>
    <h3 className="text-base font-semibold text-stone-800">{title}</h3>
    {description && <p className="text-sm text-stone-500 mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
