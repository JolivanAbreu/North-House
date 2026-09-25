import React, { useState } from "react";
import { IMaskInput } from "react-imask";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { X, Wallet, CreditCard, QrCode, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../utils/format.mjs";
import useTravarScroll from "../hooks/useTravarScroll.mjs";

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
  const [tipoCartao, setTipoCartao] = useState("Débito");
  useTravarScroll(show);

  if (!show || !comanda) return null;

  const resetar = () => {
    setForma(null);
    setPix(null);
    setValorRecebido("");
    setTipoCartao("Débito");
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
      } catch (error) {
        toast.error(error.response?.data?.message || "Não foi possível gerar o Pix.");
      } finally {
        setGerandoPix(false);
      }
    }
  };

  const handleFinalizar = async () => {
    const formaFinal = forma === "Cartão" ? `Cartão de ${tipoCartao.toLowerCase()}` : forma;
    await onFinalizar(comanda.id, formaFinal);
    resetar();
  };

  const total = parseFloat(comanda.valor_total) || 0;
  const recebido = parseFloat(String(valorRecebido).replace(",", ".")) || 0;
  const troco = recebido >= total ? recebido - total : 0;

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
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Valor recebido</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">R$</span>
              <IMaskInput
                mask={Number}
                scale={2}
                radix=","
                mapToRadix={["."]}
                thousandsSeparator="."
                min={0}
                unmask
                value={valorRecebido}
                onAccept={(v) => setValorRecebido(v)}
                placeholder="0,00"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {[total, ...[10, 20, 50, 100, 200].filter((n) => n > total)].slice(0, 5).map((valor, i) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setValorRecebido(String(valor))}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  {i === 0 ? "Valor exato" : formatCurrency(valor)}
                </button>
              ))}
            </div>
            {valorRecebido && recebido >= total && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center animate-slideUp">
                <span className="text-sm font-medium text-emerald-800">Troco a devolver:</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(troco)}</span>
              </div>
            )}
            {valorRecebido && recebido < total && (
              <p className="mt-2 text-xs text-rose-600">Faltam {formatCurrency(total - recebido)}.</p>
            )}
          </div>
        )}

        {forma === "Cartão" && (
          <div className="mb-5 animate-fadeIn">
            <p className="text-sm font-medium text-stone-700 mb-2">Tipo do cartão</p>
            <div className="grid grid-cols-2 gap-2">
              {["Débito", "Crédito"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoCartao(t)}
                  className={`py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    tipoCartao === t ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-2">Passe o cartão na maquininha e finalize após a aprovação.</p>
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
                    onClick={() => { navigator.clipboard?.writeText(pix.copiaECola); toast.success("Código Pix copiado!"); }}
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
            disabled={!forma || finalizando || (forma === "Pix" && gerandoPix) || (forma === "Dinheiro" && (!valorRecebido || recebido < total))}
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