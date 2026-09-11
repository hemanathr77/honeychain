import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addToCart = (product, quantity, size) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id && i.size === size);
      if (existing) {
        return prev.map(i => i.productId === product.id && i.size === size
          ? { ...i, quantity: i.quantity + quantity }
          : i
        );
      }
      return [...prev, {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        farmerId: product.farmerId,
        batchId: product.batchId,
        price: size === 250 ? product.price / 4 : size === 500 ? product.price / 2 : product.price,
        size,
        quantity,
        verified: product.verified,
        labTested: product.labTested,
      }];
    });
    showToast('success', `${product.name} added to cart!`);
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const showToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount, toasts, showToast, dismissToast,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
