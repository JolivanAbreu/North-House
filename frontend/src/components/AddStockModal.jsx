import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PackagePlus } from "lucide-react";
import { inputClasses } from "./ui/Input.jsx";

const AddStockModal = ({ show, onClose, onConfirm, insumo }) => {
  const [quantidade, setQuantidade] = useState("");
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

  if (!show || !insumo || !isMounted) {
    return null;
  }

  const handleSubmit = () => {
    const qtdNum = parseFloat(quantidade);
    if (!qtdNum || qtdNum <= 0) {
      return;
    }
    onConfirm(qtdNum);
    setQuantidade("");
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-100 w-full max-w-md animate-slideUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
          <PackagePlus className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold font-display mb-1 truncate">Adicionar Estoque</h2>
        <p className="mb-1 text-sm text-stone-600 truncate">
          Insumo: <span className="font-semibold">{insumo.nome}</span>
        </p>
        <p className="mb-4 text-xs text-stone-500">
          Estoque atual: {parseFloat(insumo.quantidade_em_estoque).toFixed(3)} {insumo.unidade_uso}
        </p>

        <div className="mb-6 w-full">
          <label className="block text-sm font-medium text-stone-700 mb-1.5" htmlFor="quantidade">
            Quantidade a Adicionar ({insumo.unidade_uso})
          </label>
          <input
            type="number"
            id="quantidade"
            step="0.001"
            placeholder="Ex: 10.5"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className={inputClasses}
            autoFocus
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-soft"
          >
            Adicionar ao Estoque
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddStockModal;