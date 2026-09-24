import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Tag, X, ShoppingBag } from "lucide-react";
import api, { BASE_URL } from "../../services/api.mjs";
import toast from "react-hot-toast";
import QuantitySelector from "../../components/QuantitySelector.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { inputClasses } from "../../components/ui/Input.jsx";
import { formatCurrency } from "../../utils/format.mjs";

const Carrinho = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("Retirada");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");

  const [cupomInput, setCupomInput] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState(null);
  const [validandoCupom, setValidandoCupom] = useState(false);

  const storeId = cartItems.length > 0 ? cartItems[0].UsuarioId : null;
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.precoFinal ?? item.preco_venda) * item.quantity,
    0
  );
  const desconto = cupomAplicado?.desconto || 0;
  const totalComDesconto = Math.max(subtotal - desconto, 0);

  const handleAplicarCupom = async () => {
    if (!cupomInput.trim() || !storeId) return;
    setValidandoCupom(true);
    try {
      const response = await api.post("/public/cupons/validar", {
        usuarioId: storeId,
        codigo: cupomInput.trim(),
        subtotal,
      });
      setCupomAplicado({
        codigo: response.data.codigo,
        desconto: response.data.desconto,
      });
      toast.success(`Cupom "${response.data.codigo}" aplicado!`);
    } catch (error) {
      const msg = error.response?.data?.message || "Cupom inválido.";
      toast.error(msg);
      setCupomAplicado(null);
    } finally {
      setValidandoCupom(false);
    }
  };

  const handleRemoverCupom = () => {
    setCupomAplicado(null);
    setCupomInput("");
  };

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio.");
      setLoading(false);
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefoneLimpo.length !== 11) {
      toast.error(
        "Por favor, preencha um telefone válido com DDD (11 dígitos)."
      );
      setLoading(false);
      return;
    }

    if (tipoEntrega === "Delivery" && !enderecoEntrega.trim()) {
      toast.error("Informe o endereço de entrega.");
      setLoading(false);
      return;
    }

    const pedidoData = {
      cliente: {
        nome: nome,
        telefone: telefoneLimpo,
      },
      items: cartItems.map((item) => ({
        produtoId: item.id,
        quantidade: item.quantity,
        variacaoId: item.variacaoId || undefined,
      })),
      tipo_entrega: tipoEntrega,
      forma_pagamento: formaPagamento,
      cupom_codigo: cupomAplicado ? cupomAplicado.codigo : undefined,
      endereco_entrega:
        tipoEntrega === "Delivery" ? enderecoEntrega.trim() : undefined,
    };

    try {
      const response = await api.post("/public/pedidos", pedidoData);
      toast.success("Pedido enviado com sucesso!");
      setCartItems([]);

      const { statusToken } = response.data;
      navigate(`/pedido/${statusToken}`);
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      const msg =
        error.response?.data?.message || "Houve um erro ao enviar seu pedido.";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn pb-12">
      <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">
        Finalizar Compra
      </h1>
      {storeId && (
        <Link
          to={`/loja/${storeId}`}
          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Continuar comprando
        </Link>
      )}

      <div className="bg-white rounded-2xl shadow-card border border-stone-100 mb-6 p-6">
        <h2 className="text-lg font-bold font-display mb-4">
          Resumo do Pedido
        </h2>
        {cartItems.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Seu carrinho está vazio" />
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className="flex flex-wrap justify-between items-center border-b border-stone-100 pb-4 gap-4"
              >
                <img
                  src={
                    item.imagem_url
                      ? `${BASE_URL}${item.imagem_url}`
                      : "https://placehold.co/100x100/f5c9a8/602919?text=%20"
                  }
                  alt={item.nome}
                  className="w-16 h-16 object-cover rounded-xl hidden sm:block border border-stone-100"
                />
                <div className="flex-1 min-w-[150px] sm:ml-2">
                  <h3 className="font-semibold text-stone-800">{item.nome}</h3>
                  {item.variacaoNome && (
                    <p className="text-brand-600 text-xs font-medium">
                      {item.variacaoNome}
                    </p>
                  )}
                  <p className="text-stone-500 text-sm">
                    {formatCurrency(item.precoFinal ?? item.preco_venda)} (un)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold w-24 text-right text-stone-800">
                    {formatCurrency(
                      (item.precoFinal ?? item.preco_venda) * item.quantity
                    )}
                  </p>
                </div>
              </div>
            ))}

            {/* Cupom de desconto */}
            <div className="pt-2">
              {cupomAplicado ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <Tag className="w-4 h-4" /> Cupom {cupomAplicado.codigo}{" "}
                    aplicado
                    <span className="text-emerald-600 font-normal">
                      (-{formatCurrency(cupomAplicado.desconto)})
                    </span>
                  </span>
                  <button
                    onClick={handleRemoverCupom}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código do cupom"
                    value={cupomInput}
                    onChange={(e) =>
                      setCupomInput(e.target.value.toUpperCase())
                    }
                    className={inputClasses}
                  />
                  <button
                    type="button"
                    onClick={handleAplicarCupom}
                    disabled={validandoCupom || !cupomInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 text-white font-semibold text-sm hover:bg-stone-900 disabled:bg-stone-300 transition-colors whitespace-nowrap"
                  >
                    {validandoCupom ? "..." : "Aplicar"}
                  </button>
                </div>
              )}
            </div>

            <div className="text-right mt-4 space-y-1 pt-4 border-t border-stone-100">
              {desconto > 0 && (
                <div className="flex justify-end gap-3 text-stone-500 text-sm">
                  <span>Subtotal</span>
                  <span className="w-28 font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-end gap-3 text-lg font-bold text-stone-900">
                <span>Total</span>
                <span className="w-28">
                  {formatCurrency(totalComDesconto)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Carrinho;