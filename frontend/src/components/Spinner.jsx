import React from 'react';
import { Loader2 } from 'lucide-react';

const SIZE_MAP = {
  '4': 'w-4 h-4',
  '6': 'w-6 h-6',
  '8': 'w-8 h-8',
  '10': 'w-10 h-10',
  '12': 'w-12 h-12',
};

const COLOR_MAP = {
  brand: 'text-brand-600',
  gray: 'text-stone-400',
  white: 'text-white',
};

const Spinner = ({ size = '8', color = 'brand' }) => (
  <Loader2 className={`${SIZE_MAP[size] || SIZE_MAP['8']} ${COLOR_MAP[color] || COLOR_MAP.brand} animate-spin`} />
);

export default Spinner;
