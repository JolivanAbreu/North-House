import React, { useState } from 'react';
import { BRAND } from '../config/brand.mjs';

// Mostra o logo da Casa do Norte (public/logo.png). Se o arquivo ainda não
// existir, cai num monograma pra tela nunca ficar com imagem quebrada.
// completo = emblema + nome "CASA DO NORTE / PRODUTOS REGIONAIS".
const SIZES = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-24 h-24 text-2xl',
  xl: 'w-40 h-40 text-3xl',
};

const Logo = ({ size = 'sm', completo = false, className = '' }) => {
  const [erro, setErro] = useState(false);
  const tamanho = SIZES[size] || SIZES.sm;

  if (erro) {
    return (
      <span
        className={`${tamanho} rounded-xl bg-stone-900 text-brand-300 font-display font-extrabold flex items-center justify-center tracking-tight shrink-0 ${className}`}
        aria-label={BRAND.nome}
      >
        CdN
      </span>
    );
  }

  return (
    <img
      src={completo ? BRAND.logoCompleto : BRAND.logo}
      alt={BRAND.nome}
      onError={() => setErro(true)}
      className={`${tamanho} object-contain shrink-0 ${className}`}
    />
  );
};

export default Logo;
