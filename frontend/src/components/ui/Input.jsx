import React from 'react';

export const inputClasses =
  'w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-colors duration-150';

export const Label = ({ children, htmlFor, hint }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-stone-700 mb-1.5">
    {children}
    {hint && <span className="text-stone-400 font-normal ml-1">{hint}</span>}
  </label>
);

export const Field = ({ label, hint, htmlFor, children, help }) => (
  <div>
    {label && <Label htmlFor={htmlFor} hint={hint}>{label}</Label>}
    {children}
    {help && <p className="text-xs text-stone-500 mt-1.5">{help}</p>}
  </div>
);

export default inputClasses;
