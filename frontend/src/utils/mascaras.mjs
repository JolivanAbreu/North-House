// Padronização de dados digitados nos formulários da Casa do Norte.
// As máscaras visuais ficam no react-imask; aqui ficam as regras de limpeza
// aplicadas antes de salvar.

// Palavras que continuam minúsculas no meio de nomes ("Maria da Silva").
const PREPOSICOES = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

// "  joão   DA silva " -> "João da Silva"
export const capitalizarNome = (texto = '') =>
  String(texto)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((palavra, i) =>
      i > 0 && PREPOSICOES.has(palavra)
        ? palavra
        : palavra.charAt(0).toUpperCase() + palavra.slice(1),
    )
    .join(' ');

// Mantém só os dígitos (telefone, CEP, código de barras).
export const somenteDigitos = (texto = '') => String(texto).replace(/\D/g, '');

// Máscaras usadas nos IMaskInput
export const MASCARA_TELEFONE = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }];
export const MASCARA_CEP = '00000-000';

// "85999998888" / "5585999998888" -> "(85) 99999-8888"
export const formatarTelefone = (tel = '') => {
  const d = somenteDigitos(tel).replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
};
