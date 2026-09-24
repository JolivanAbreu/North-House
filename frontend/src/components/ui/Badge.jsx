import React from 'react';

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  stone: 'bg-stone-100 text-stone-600 ring-stone-200',
  delivery: 'bg-[#fff4de] text-[#8a5700] ring-[#ffdf9e]',
};

const Badge = ({ color = 'stone', children, className = '', dot = false }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${COLOR_MAP[color] || COLOR_MAP.stone} ${className}`}
  >
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${COLOR_MAP[color] ? '' : ''} bg-current opacity-70`} />}
    {children}
  </span>
);

export default Badge;
