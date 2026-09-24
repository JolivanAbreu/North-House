import React from "react";
import { Link } from "react-router-dom";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import useCart from "../hooks/useCart.mjs";
import { formatCurrency } from "../utils/format.mjs";
import { BASE_URL } from "../services/api.mjs";

const CartSlider = () => {
  const { cartItems, removeFromCart, getTotalCost, isCartOpen, closeCart } =
    useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-20 transition-opacity duration-300
        ${isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closeCart}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-lifted z-30
        transform transition-transform duration-300 ease-in-out
        ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <header className="flex justify-between items-center p-5 border-b border-stone-100">
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-600" />
              Meu Carrinho
            </h2>
            <button
              onClick={closeCart}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-brand-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  O seu carrinho está vazio
                </h3>
                <p className="text-stone-500 text-sm mt-1">
                  Adicione produtos da vitrine para começar.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-6 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors text-sm"
                >
                  Continuar a comprar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-3 animate-fadeIn">
                    <img
                      src={
                        item.imagem_url
                          ? `${BASE_URL}${item.imagem_url}`
                          : "https://placehold.co/100x100/f5c9a8/602919?text=%20"
                      }
                      alt={item.nome}
                      className="w-16 h-16 object-cover rounded-xl border border-stone-100"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-stone-800">{item.nome}</h4>
                      {item.variacaoNome && (
                        <p className="text-xs text-brand-600 font-medium">{item.variacaoNome}</p>
                      )}
                      <p className="text-xs text-stone-500">Qtd: {item.quantity}</p>
                      <p className="font-semibold text-sm text-brand-700">
                        {formatCurrency((item.precoFinal ?? item.preco_venda) * item.quantity)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-stone-300 hover:text-rose-500 self-start p-1 transition-colors"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <footer className="p-5 border-t border-stone-100 bg-stone-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-stone-600 font-medium">Total</span>
                <span className="text-xl font-bold text-stone-900">
                  {formatCurrency(getTotalCost())}
                </span>
              </div>
              <Link
                to="/carrinho"
                onClick={closeCart}
                className="block w-full text-center bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-soft"
              >
                Ir para o Checkout
              </Link>
            </footer>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSlider;
