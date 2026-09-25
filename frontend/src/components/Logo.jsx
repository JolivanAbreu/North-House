import React, { useState } from 'react';
import { BRAND } from '../config/brand.mjs';

// Mostra o logo do Casa Nova (public/logo.png). Se o arquivo ainda não
// existir, cai num monograma "CN" pra tela nunca ficar com imagem quebrada.
const SIZES = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-20 h-20 text-2xl',
};

const Logo = ({ size = 'sm', className = '' }) => {
  const [erro, setErro] = useState(false);
  const tamanho = SIZES[size] || SIZES.sm;

  if (erro) {
    return (
      <span
        className={`${tamanho} rounded-xl bg-stone-900 text-brand-300 font-display font-extrabold flex items-center justify-center tracking-tight shrink-0 ${className}`}
        aria-label={BRAND.nome}
      >
        CN
      </span>
    );
  }

  return (
    <img
      src={BRAND.logo}
      alt={BRAND.nome}
      onError={() => setErro(true)}
      className={`${tamanho} object-contain shrink-0 ${className}`}
    />
  );
};

export default Logo;
