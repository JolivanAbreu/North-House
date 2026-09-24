import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
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

  if (!show || !isMounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-100 w-full max-w-md animate-slideUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 mx-auto sm:mx-0">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
        </div>

        <h2 className="text-xl font-bold font-display text-stone-900 mb-2 text-center sm:text-left">
          {title}
        </h2>
        <p className="text-stone-600 text-sm mb-6 text-center sm:text-left leading-relaxed">
          {message}
        </p>

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
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-colors shadow-soft"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmationModal;