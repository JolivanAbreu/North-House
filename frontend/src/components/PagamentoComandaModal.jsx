import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wallet, CreditCard, QrCode, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../utils/format.mjs";

const FORMAS = [
  { value: "Dinheiro", label: "Dinheiro", icon: Wallet },
  { value: "Cartão", label: "Cartão", icon: CreditCard },
  { value: "Pix", label: "Pix", icon: QrCode },
];

const PagamentoComandaModal = ({ show, onClose, comanda, onGerarPix, onFinalizar, finalizando }) => {
  const [forma, setForma] = useState(null);
  const [pix, setPix] = useState(null);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [valorRecebido, setValorRecebido] = useState("");
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

  if (!show || !comanda || !isMounted) return null;

  const resetar = () => {
    setForma(null);
    setPix(null);
    setValorRecebido("");
  };

  const handleEscolherForma = async (valor) => {
    setForma(valor);
    setPix(null);
    setValorRecebido("");
    if (valor === "Pix") {
      setGerandoPix(true);
      try {
        const resultado = await onGerarPix(comanda.id);
        setPix(resultado);
      } finally {
        setGerandoPix(false);
      }
    }
  };

  const handleFinalizar = async () => {
    // Caso a API espere receber os valores, você pode passar nos parâmetros.
    // Aqui estou mantendo apenas forma, conforme a assinatura original de onFinalizar
    await onFinalizar(comanda.id, forma);
    resetar();
  };

  const calcularTroco = () => {
    if (!valorRecebido) return 0;
    const recebido = parseFloat(valorRecebido.replace(",", "."));
    const total = parseFloat(comanda.valor_total);
    if (isNaN(recebido) || recebido < total) return 0;
    return recebido - total;
  };

  const troco = calcularTroco();

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
          <h2 className="text-xl font-bold font-display">Pagamento</h2>
          <button
            onClick={() => { resetar(); onClose(); }}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 mb-5 text-center w-full">
          <p className="text-xs text-stone-500 uppercase font-semibold tracking-wide">Valor total</p>
          <p className="text-3xl font-bold font-display text-stone-900 mt-1 truncate">
            {formatCurrency(comanda.valor_total)}
          </p>
        </div>

        <p className="text-sm font-medium text-stone-700 mb-2">Forma de pagamento</p>
        <div className="grid grid-cols-3 gap-2 mb-5 w-full">
          {FORMAS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleEscolherForma(value)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                forma === value ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {forma === "Dinheiro" && (
          <div className="mb-5 animate-fadeIn">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Valor recebido (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min={comanda.valor_total}
              placeholder="Ex: 50.00"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              autoFocus
            />
            {valorRecebido && parseFloat(valorRecebido) >= comanda.valor_total && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center animate-slideUp">
                <span className="text-sm font-medium text-emerald-800">Troco a devolver:</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCurrency(troco)}
                </span>
              </div>
            )}
          </div>
        )}

        {forma === "Pix" && (
          <div className="mb-5 text-center w-full">
            {gerandoPix ? (
              <p className="text-sm text-stone-500 py-6">Gerando QR code Pix...</p>
            ) : pix ? (
              <div>
                <img src={pix.qrCodeUrl} alt="QR Code Pix" className="mx-auto w-44 h-44 rounded-xl border border-stone-100" />
                <p className="text-xs text-stone-400 mt-2">
                  {pix.real ? "Pix real via Mercado Pago" : "QR ilustrativo (Mercado Pago não configurado)"}
                </p>
                {pix.copiaECola && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(pix.copiaECola)}
                    className="text-xs text-brand-600 font-semibold underline mt-1"
                  >
                    Copiar código Pix
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { resetar(); onClose(); }}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-semibold text-sm hover:bg-stone-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={!forma || finalizando || (forma === "Pix" && gerandoPix) || (forma === "Dinheiro" && (!valorRecebido || parseFloat(valorRecebido) < comanda.valor_total))}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:bg-stone-300 shadow-soft"
          >
            <CheckCircle2 className="w-4 h-4" /> {finalizando ? "Finalizando..." : "Finalizar comanda"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PagamentoComandaModal;