import React, { createContext, useState, useEffect } from "react";

const CartContext = createContext();

// Monta uma chave única por combinação produto+variação, já que agora o
// mesmo produto pode estar no carrinho mais de uma vez com variações
// diferentes (ex: Pizza Grande e Pizza Média).
const buildCartItemId = (produtoId, variacaoId) => `${produtoId}::${variacaoId || "base"}`;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem("sgv-cart");
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Não foi possível ler o carrinho do localStorage", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sgv-cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // `variacao` é opcional: { id, nome, ajuste_preco }
  const addToCart = (produto, variacao = null) => {
    const cartItemId = buildCartItemId(produto.id, variacao?.id);
    const precoFinal = parseFloat(produto.preco_venda) + (variacao ? parseFloat(variacao.ajuste_preco || 0) : 0);

    setCartItems((prevItems) => {
      const itemExistente = prevItems.find((item) => item.cartItemId === cartItemId);

      if (itemExistente) {
        return prevItems.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            ...produto,
            cartItemId,
            quantity: 1,
            UsuarioId: produto.UsuarioId,
            variacaoId: variacao?.id || null,
            variacaoNome: variacao?.nome || null,
            precoFinal,
          },
        ];
      }
    });
    openCart();
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  const updateQuantity = (cartItemId, quantity) => {
    const novaQuantidade = parseInt(quantity, 10);
    if (novaQuantidade <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: novaQuantidade } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalCost = () => {
    return cartItems.reduce(
      (total, item) => total + (item.precoFinal ?? item.preco_venda) * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalCost,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
