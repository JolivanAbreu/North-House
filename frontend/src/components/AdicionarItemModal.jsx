import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus } from "lucide-react";
import { formatPrecoUnidade } from "../utils/format.mjs";

const AdicionarItemModal = ({
  show,
  onClose,
  onConfirm,
  produtos = [],
  adicionando,
}) => {
  const [aba, setAba] = useState("cardapio");
  const [busca, setBusca] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (show) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  const produtoSelecionado = useMemo(
    () => produtos.find((p) => String(p.id) === String(produtoId)) || null,
    [produtos, produtoId]
  );

  const produtosFiltrados = useMemo(() => {
    return produtos
      .filter((p) => p.disponivel !== false)
      .filter((p) => (p.Categoria?.tipo || "cardapio") === aba)
      .filter(
        (p) =>
          !busca.trim() ||
          p.nome.toLowerCase().includes(busca.trim().toLowerCase())
      );
  }, [produtos, aba, busca]);

  if (!show || !isMounted) return null;

  const resetar = () => {
    setBusca("");
    setProdutoId("");
    setQuantidade("1");
  };

  const handleConfirmar = () => {
    if (!produtoSelecionado || parseFloat(quantidade) <= 0) return;
    onConfirm({
      produtoId: produtoSelecionado.id,
      quantidade: parseFloat(quantidade),
    });
    resetar();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-100 w-full max-w-lg animate-slideUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-display text-stone-900">
            Adicionar item
          </h2>
          <button
            onClick={() => {
              resetar();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => {
              setAba("cardapio");
              setProdutoId("");
            }}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              aba === "cardapio"
                ? "bg-emerald-600 text-white shadow-soft"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Cardápio
          </button>
          <button
            type="button"
            onClick={() => {
              setAba("mercearia");
              setProdutoId("");
            }}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              aba === "mercearia"
                ? "bg-amber-600 text-white shadow-soft"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Mercearia
          </button>
        </div>

        <div className="relative mb-3 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
          />
        </div>

        <div className="border border-stone-100 rounded-xl mb-4 divide-y divide-stone-50 max-h-[40vh] overflow-y-auto">
          {produtosFiltrados.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">
              Nenhum produto encontrado.
            </p>
          ) : (
            produtosFiltrados.map((produto) => (
              <button
                key={produto.id}
                type="button"
                onClick={() => setProdutoId(String(produto.id))}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 hover:bg-stone-50 transition-colors ${
                  String(produto.id) === produtoId
                    ? "bg-brand-50/60 font-semibold"
                    : ""
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {produto.nome}
                  </p>
                  <p className="text-xs text-stone-400 truncate">
                    {produto.Categoria?.nome}
                  </p>
                </div>
                <span className="text-sm font-semibold text-stone-700 shrink-0">
                  {formatPrecoUnidade(
                    produto.preco_venda,
                    produto.unidade_venda
                  )}
                </span>
              </button>
            ))
          )}
        </div>

        {produtoSelecionado && (
          // O input de quantidade agora fica alinhado em linha e menor, economizando espaço 
          <div className="mb-5 animate-fadeIn flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
            <label className="text-sm font-medium text-stone-700">
              Quantidade {produtoSelecionado.unidade_venda === "kg" ? "(em kg)" : "(unidades)"}
            </label>
            <input
              type="number"
              step={produtoSelecionado.unidade_venda === "kg" ? "0.001" : "1"}
              min={produtoSelecionado.unidade_venda === "kg" ? "0.001" : "1"}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-24 px-3 py-1.5 text-center font-semibold text-stone-900 rounded-lg border border-stone-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              resetar();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!produtoSelecionado || adicionando}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:bg-stone-300 shadow-soft"
          >
            <Plus className="w-4 h-4" />{" "}
            {adicionando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AdicionarItemModal;