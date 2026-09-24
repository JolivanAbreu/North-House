import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ClipboardPlus } from "lucide-react";
import { inputClasses, Field } from "./ui/Input.jsx";

const NovaComandaModal = ({ show, onClose, onConfirm, mesasLivres = [], salvando }) => {
  const [nomeCliente, setNomeCliente] = useState("");
  const [mesaId, setMesaId] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Garante que o Portal só será renderizado no lado do cliente e trava o scroll
  useEffect(() => {
    setIsMounted(true);
    if (show) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [show]);

  if (!show || !isMounted) return null;

  const resetar = () => {
    setNomeCliente("");
    setMesaId("");
  };

  const handleConfirmar = () => {
    onConfirm({ nome_cliente: nomeCliente.trim(), mesaId: mesaId || null });
    resetar();
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
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <ClipboardPlus className="w-5 h-5 text-violet-600" />
            </span>
            <h2 className="text-xl font-bold font-display">Nova comanda local</h2>
          </div>
          <button
            onClick={() => { resetar(); onClose(); }}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-stone-500 mb-5 leading-relaxed">
          Cliente e mesa são opcionais — pode abrir uma comanda de balcão sem preencher nada.
        </p>

        <div className="space-y-4 mb-6 w-full">
          <Field label="Nome do cliente (opcional)">
            <input
              type="text"
              placeholder="Ex: João"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              className={inputClasses}
              autoFocus
            />
          </Field>
          <Field label="Mesa (opcional)">
            <select
              value={mesaId}
              onChange={(e) => setMesaId(e.target.value)}
              className={`${inputClasses} bg-white`}
            >
              <option value="">Sem mesa / balcão</option>
              {mesasLivres.map((mesa) => (
                <option key={mesa.id} value={mesa.id}>Mesa {mesa.numero}</option>
              ))}
            </select>
            {mesasLivres.length === 0 && (
              <span className="text-xs text-stone-400 mt-1 block">Nenhuma mesa livre cadastrada no momento.</span>
            )}
          </Field>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => { resetar(); onClose(); }}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={salvando}
            className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors disabled:bg-stone-300 shadow-soft"
          >
            {salvando ? "Abrindo..." : "Abrir comanda"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default NovaComandaModal;