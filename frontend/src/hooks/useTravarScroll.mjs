import { useEffect } from 'react';

// Trava o scroll da página enquanto um modal está aberto. Conta quantos
// modais estão abertos ao mesmo tempo (comanda -> adicionar item -> pagamento),
// então fechar o de cima não destrava o fundo enquanto o de baixo segue aberto.
let modaisAbertos = 0;

const useTravarScroll = (ativo) => {
  useEffect(() => {
    if (!ativo) return undefined;
    modaisAbertos += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      modaisAbertos = Math.max(0, modaisAbertos - 1);
      if (modaisAbertos === 0) document.body.style.overflow = '';
    };
  }, [ativo]);
};

export default useTravarScroll;
