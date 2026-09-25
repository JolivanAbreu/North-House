import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus, Minus, Barcode } from "lucide-react";
import { IMaskInput } from "react-imask";
import toast from "react-hot-toast";
import { formatCurrency, formatPrecoUnidade } from "../utils/format.mjs";
import useTravarScroll from "../hooks/useTravarScroll.mjs";

// Lança itens na comanda. Fica aberto depois de cada item para lançar
// vários seguidos. Na busca, um código de barras + Enter (leitor USB/Bluetooth
// funciona como teclado) já seleciona o produto da mercearia.
const AdicionarItemModal = ({ show, onClose, onConfirm, produtos = [], adicionando }) => {
  const [aba, setAba] = useState("cardapio");
  const [busca, setBusca] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const buscaRef = useRef(null);
  const qtdRef = useRef(null);

  useTravarScroll(show);
  useEffect(() => {
    if (show) setTimeout(() => buscaRef.current?.focus(), 50);
  }, [show]);

  const produtosAtivos = useMemo(() => produtos.filter((p) => p.disponivel !== false), [produtos]);

  const produtoSelecionado = useMemo(
    () => produtosAtivos.find((p) => String(p.id) === String(produtoId)) || null,
    [produtosAtivos, produtoId],
  );

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtosAtivos
      .filter((p) => (p.Categoria?.tipo || "cardapio") === aba)
      .filter(
        (p) =>
          !termo ||
          p.nome.toLowerCase().includes(termo) ||
          (p.Categoria?.nome || "").toLowerCase().includes(termo) ||
          (p.codigo_barras || "").includes(termo),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [produtosAtivos, aba, busca]);

  if (!show) return null;

  const ehKg = produtoSelecionado?.unidade_venda === "kg";
  const qtdNumero = parseFloat(String(quantidade).replace(",", ".")) || 0;
  const subtotalPrevia = produtoSelecionado ? qtdNumero * parseFloat(produtoSelecionado.preco_venda) : 0;

  const resetar = () => {
    setBusca("");
    setProdutoId("");
    setQuantidade("1");
  };

  const fechar = () => {
    resetar();
    onClose();
  };

  const selecionar = (produto) => {
    setProdutoId(String(produto.id));
    setQuantidade(produto.unidade_venda === "kg" ? "" : "1");
    setTimeout(() => qtdRef.current?.focus(), 30);
  };

  // Enter na busca: se for um código de barras, procura em todos os produtos
  const handleBuscaKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const termo = busca.trim();
    if (/^\d{8,14}$/.test(termo)) {
      const achado = produtosAtivos.find((p) => p.codigo_barras === termo);
      if (achado) {
        setAba(achado.Categoria?.tipo || "mercearia");
        setBusca("");
        selecionar(achado);
      } else {
        toast.error("Nenhum produto com esse código de barras.");
      }
      return;
    }
    if (produtosFiltrados.length === 1) selecionar(produtosFiltrados[0]);
  };

  const ajustarQtd = (delta) => {
    const passo = ehKg ? 0.1 : 1;
    const nova = Math.max(ehKg ? 0.001 : 1, parseFloat((qtdNumero + delta * passo).toFixed(3)));
    setQuantidade(String(nova));
  };

  const handleConfirmar = async () => {
    if (!produtoSelecionado || qtdNumero <= 0 || adicionando) return;
    const ok = await onConfirm({ produtoId: produtoSelecionado.id, quantidade: qtdNumero });
    if (ok !== false) {
      resetar();
      setTimeout(() => buscaRef.current?.focus(), 30);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={fechar}
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-100 w-full max-w-lg animate-slideUp relative max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-display text-stone-900">Adicionar itens</h2>
          <button onClick={fechar} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          {[
            { value: "cardapio", label: "Cardápio", ativo: "bg-emerald-600" },
            { value: "mercearia", label: "Mercearia", ativo: "bg-amber-600" },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setAba(t.value); setProdutoId(""); }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                aba === t.value ? `${t.ativo} text-white shadow-soft` : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative mb-3 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={buscaRef}
            type="text"
            placeholder="Buscar produto ou bipar código de barras..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={handleBuscaKeyDown}
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
          />
          <Barcode className="w-4 h-4 text-stone-300 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="border border-stone-100 rounded-xl mb-4 divide-y divide-stone-50 overflow-y-auto min-h-[120px] max-h-[36vh]">
          {produtosFiltrados.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">Nenhum produto encontrado.</p>
          ) : (
            produtosFiltrados.map((produto) => (
              <button
                key={produto.id}
                type="button"
                onClick={() => selecionar(produto)}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 hover:bg-stone-50 transition-colors ${
                  String(produto.id) === produtoId ? "bg-brand-50/70" : ""
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium text-stone-800 truncate">{produto.nome}</p>
                  <p className="text-xs text-stone-400 truncate">{produto.Categoria?.nome}</p>
                </div>
                <span className="text-sm font-semibold text-stone-700 shrink-0">
                  {formatPrecoUnidade(produto.preco_venda, produto.unidade_venda)}
                </span>
              </button>
            ))
          )}
        </div>

        {produtoSelecionado && (
          <div className="mb-5 animate-fadeIn bg-stone-50 p-3 rounded-xl border border-stone-100">
            <p className="text-sm font-semibold text-stone-800 truncate mb-2">{produtoSelecionado.nome}</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => ajustarQtd(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:bg-stone-100">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <IMaskInput
                  inputRef={qtdRef}
                  mask={Number}
                  scale={ehKg ? 3 : 0}
                  radix=","
                  mapToRadix={["."]}
                  min={0}
                  max={9999}
                  unmask
                  value={quantidade}
                  onAccept={(v) => setQuantidade(v)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
                  placeholder={ehKg ? "0,000" : "1"}
                  className="w-24 px-3 py-1.5 text-center font-semibold text-stone-900 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button type="button" onClick={() => ajustarQtd(1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:bg-stone-100">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-stone-500 ml-1">{ehKg ? "kg" : "un"}</span>
              </div>
              <span className="text-sm font-bold text-stone-900 tabular-nums">{formatCurrency(subtotalPrevia)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={fechar}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-200 transition-colors"
          >
            Concluído
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!produtoSelecionado || qtdNumero <= 0 || adicionando}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:bg-stone-300 shadow-soft"
          >
            <Plus className="w-4 h-4" /> {adicionando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AdicionarItemModal;
