import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, ClipboardPlus, UtensilsCrossed, Bike, ShoppingBag } from "lucide-react";
import { IMaskInput } from "react-imask";
import { inputClasses, Field } from "./ui/Input.jsx";
import { capitalizarNome, MASCARA_TELEFONE } from "../utils/mascaras.mjs";
import useTravarScroll from "../hooks/useTravarScroll.mjs";

const TIPOS = [
  { value: "Local", label: "No salão", icon: UtensilsCrossed, ativo: "bg-violet-600 text-white border-violet-600" },
  { value: "Delivery", label: "Delivery", icon: Bike, ativo: "bg-[#ffb700] text-stone-900 border-[#ffb700]" },
  { value: "Retirada", label: "Retirada", icon: ShoppingBag, ativo: "bg-sky-600 text-white border-sky-600" },
];

const ESTADO_INICIAL = { tipo: "Local", nome: "", mesaId: "", telefone: "", endereco: "" };

// Sem vitrine pública, os pedidos de delivery/retirada (telefone, WhatsApp)
// também são lançados aqui pelo próprio atendente.
// tipoInicial / tiposPermitidos: a tela de Delivery abre o modal já em
// "Delivery" e sem a opção "No salão".
const NovaComandaModal = ({
  show, onClose, onConfirm, mesasLivres = [], mesaInicial = "", salvando,
  tipoInicial = "Local", tiposPermitidos = null, titulo = "Nova comanda",
}) => {
  // Já abre com a mesa escolhida no mapa de mesas (se houver). O componente
  // pai troca a "key" a cada abertura, então o formulário sempre começa limpo.
  const [form, setForm] = useState(() => ({ ...ESTADO_INICIAL, tipo: tipoInicial, mesaId: mesaInicial || "" }));
  useTravarScroll(show);

  if (!show) return null;

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const ehLocal = form.tipo === "Local";
  const ehDelivery = form.tipo === "Delivery";

  const faltaEndereco = ehDelivery && !form.endereco.trim();
  const faltaTelefone = !ehLocal && form.telefone.replace(/\D/g, "").length < 10;
  const faltaNome = !ehLocal && !form.nome.trim();
  const invalido = faltaEndereco || faltaTelefone || faltaNome;

  const handleConfirmar = (e) => {
    e?.preventDefault();
    if (invalido || salvando) return;
    onConfirm({
      tipo_entrega: form.tipo,
      nome_cliente: capitalizarNome(form.nome),
      mesaId: ehLocal ? form.mesaId || null : null,
      telefone_cliente: ehLocal ? null : form.telefone,
      endereco_entrega: ehDelivery ? form.endereco.trim() : null,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <form
        onSubmit={handleConfirmar}
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-100 w-full max-w-md animate-slideUp relative max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <ClipboardPlus className="w-5 h-5 text-brand-600" />
            </span>
            <h2 className="text-xl font-bold font-display">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tipo de atendimento */}
        <div className={`grid ${tiposPermitidos && tiposPermitidos.length === 2 ? "grid-cols-2" : "grid-cols-3"} gap-2 mb-5`}>
          {TIPOS.filter((t) => !tiposPermitidos || tiposPermitidos.includes(t.value)).map(({ value, label, icon: Icon, ativo }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("tipo")(value)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                form.tipo === value ? `${ativo} shadow-soft` : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-6 w-full">
          <Field label={ehLocal ? "Nome do cliente (opcional)" : "Nome do cliente"}>
            <input
              type="text"
              placeholder="Ex: João"
              value={form.nome}
              onChange={(e) => set("nome")(e.target.value)}
              onBlur={(e) => set("nome")(capitalizarNome(e.target.value))}
              className={inputClasses}
              maxLength={60}
              autoFocus
            />
          </Field>

          {ehLocal ? (
            <Field label="Mesa (opcional)">
              <select
                value={form.mesaId}
                onChange={(e) => set("mesaId")(e.target.value)}
                className={`${inputClasses} bg-white`}
              >
                <option value="">Sem mesa / balcão</option>
                {mesasLivres.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>Mesa {mesa.numero}</option>
                ))}
              </select>
              {mesasLivres.length === 0 && (
                <span className="text-xs text-stone-400 mt-1 block">Todas as mesas estão ocupadas no momento.</span>
              )}
            </Field>
          ) : (
            <Field label="Telefone / WhatsApp">
              <IMaskInput
                mask={MASCARA_TELEFONE}
                value={form.telefone}
                onAccept={(v) => set("telefone")(v)}
                placeholder="(85) 99999-9999"
                className={inputClasses}
                inputMode="tel"
              />
            </Field>
          )}

          {ehDelivery && (
            <Field label="Endereço de entrega" help="Rua, número, bairro e ponto de referência.">
              <textarea
                rows={2}
                value={form.endereco}
                onChange={(e) => set("endereco")(e.target.value)}
                placeholder="Ex: Rua das Flores, 120 - Centro (próx. à farmácia)"
                className={inputClasses}
                maxLength={250}
              />
            </Field>
          )}
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
            type="submit"
            disabled={salvando || invalido}
            className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors disabled:bg-stone-300 shadow-soft"
          >
            {salvando ? "Abrindo..." : "Abrir comanda"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

export default NovaComandaModal;
