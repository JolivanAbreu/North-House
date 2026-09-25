// Períodos usados nos Relatórios e no histórico de Pedidos.
export const PERIODOS = [
  { value: "hoje", label: "Diário" },
  { value: "semana", label: "Semanal" },
  { value: "mes", label: "Mensal" },
  { value: "semestre", label: "Semestral" },
  { value: "ano", label: "Anual" },
  { value: "tudo", label: "Tudo" },
];

// "2026-09-25" (valor de <input type="date">) -> Date no fuso local
export const dataLocal = (iso, fimDoDia = false) => {
  if (!iso) return null;
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return null;
  return fimDoDia ? new Date(a, m - 1, d, 23, 59, 59, 999) : new Date(a, m - 1, d, 0, 0, 0, 0);
};

/**
 * periodo: um dos PERIODOS ou "especifico" (usa de/ate no formato "AAAA-MM-DD").
 * agora: injetável para testes.
 */
export const dentroDoPeriodo = (dataISO, periodo, { de, ate } = {}, agora = new Date()) => {
  if (periodo === "tudo") return true;
  const data = new Date(dataISO);
  if (periodo === "especifico") {
    const ini = dataLocal(de);
    const fim = dataLocal(ate, true);
    if (ini && data < ini) return false;
    if (fim && data > fim) return false;
    return true;
  }
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);
  if (periodo === "hoje") return data >= hoje;
  if (periodo === "semana") {
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - hoje.getDay());
    return data >= inicio;
  }
  if (periodo === "mes") return data >= new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  if (periodo === "semestre") return data >= new Date(hoje.getFullYear(), hoje.getMonth() < 6 ? 0 : 6, 1);
  if (periodo === "ano") return data >= new Date(hoje.getFullYear(), 0, 1);
  return true;
};
