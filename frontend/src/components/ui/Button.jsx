import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-soft disabled:bg-stone-300',
  secondary: 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 disabled:text-stone-400',
  accent: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft disabled:bg-stone-300',
  ghost: 'bg-transparent text-stone-600 hover:bg-stone-100 disabled:text-stone-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-stone-300',
  dangerGhost: 'bg-transparent text-rose-600 hover:bg-rose-50 disabled:text-stone-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export const buttonClasses = (variant = 'primary', size = 'md', className = '') =>
  `inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200
   active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100
   ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`;

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  to,
  type = 'button',
  ...props
}) => {
  const classes = buttonClasses(variant, size, className);

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled || loading} className={classes} {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
};

export default Button;
