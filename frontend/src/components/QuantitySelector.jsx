import React from 'react';
import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({ quantity, onDecrease, onIncrease }) => {
  return (
    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={onDecrease}
        className="p-2 text-stone-500 hover:bg-stone-100 hover:text-brand-600 transition-colors"
        aria-label="Diminuir quantidade"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="px-3 text-center w-10 font-medium text-stone-800 text-sm" aria-label="Quantidade atual">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        className="p-2 text-stone-500 hover:bg-stone-100 hover:text-brand-600 transition-colors"
        aria-label="Aumentar quantidade"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default QuantitySelector;
