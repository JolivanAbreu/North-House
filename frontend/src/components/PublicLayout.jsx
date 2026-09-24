import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ShoppingBag, PackageSearch, Store } from "lucide-react";
import useCart from "../hooks/useCart.mjs";
import { Toaster } from "react-hot-toast";
import CartSlider from "./CartSlider.jsx";

const PublicLayout = () => {
  const { cartItems, openCart } = useCart();
  const navigate = useNavigate();

  const [activeOrderToken, setActiveOrderToken] = useState(null);

  useEffect(() => {
    const tokensSalvos =
      JSON.parse(localStorage.getItem("sgv-active-order-tokens")) || [];
    if (tokensSalvos.length > 0) {
      setActiveOrderToken(tokensSalvos[0]);
    }
  }, [navigate]);

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#292524',
            boxShadow: '0 8px 24px -8px rgba(52,20,9,0.2)',
          },
        }}
      />
      <CartSlider />

      <header className="bg-white/90 backdrop-blur border-b border-stone-100 sticky top-0 z-10">
        <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link to="/loja/1" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-soft group-hover:bg-brand-700 transition-colors">
              <Store className="w-5 h-5 text-white" strokeWidth={2} />
            </span>
            <span className="text-lg font-bold font-display text-stone-900 hidden sm:block">
              SGV <span className="text-brand-600">MEI</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {activeOrderToken && (
              <Link
                to={`/pedido/${activeOrderToken}`}
                title="Acompanhar último pedido"
                className="flex items-center gap-1.5 text-stone-600 hover:text-brand-600 transition-colors text-sm font-medium px-2 py-2 rounded-lg hover:bg-stone-50"
              >
                <PackageSearch className="w-5 h-5" />
                <span className="hidden sm:block">Acompanhar Pedido</span>
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative flex items-center gap-1.5 text-stone-700 hover:text-brand-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-stone-50"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center ring-2 ring-white">
                  {totalItems}
                </span>
              )}
              <span className="hidden sm:block">Carrinho</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-stone-100 py-6 text-center text-xs text-stone-400">
        Feito com <span className="text-brand-500">♥</span> para pequenos negócios · SGV MEI
      </footer>
    </div>
  );
};

export default PublicLayout;
