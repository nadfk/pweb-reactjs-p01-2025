import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Definisikan tipe data untuk item di keranjang
interface CartItem {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  quantity: number;
}

// Definisikan tipe data untuk Book (agar bisa menambahkannya ke keranjang)
interface Book {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  // tambahkan properti lain jika perlu
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: Book, quantity: number) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, newQuantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Ambil data keranjang dari localStorage
const getInitialCart = (): CartItem[] => {
  const storedCart = localStorage.getItem("cart");
  return storedCart ? JSON.parse(storedCart) : [];
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(getInitialCart);

  // Simpan keranjang ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (book: Book, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === book.id);
      
      if (existingItem) {
        // Jika sudah ada, update kuantitasnya
        const newQuantity = Math.min(existingItem.quantity + quantity, book.stock_quantity); // Batasi stok
        return prevItems.map((item) =>
          item.id === book.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        // Jika belum ada, tambahkan item baru
        return [
          ...prevItems,
          {
            id: book.id,
            title: book.title,
            price: book.price,
            stock_quantity: book.stock_quantity,
            quantity: Math.min(quantity, book.stock_quantity), // Batasi stok
          },
        ];
      }
    });
  };

  const removeFromCart = (bookId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== bookId));
  };

  const updateQuantity = (bookId: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === bookId) {
          // Pastikan kuantitas baru valid (antara 1 dan stok)
          const validQuantity = Math.max(1, Math.min(newQuantity, item.stock_quantity));
          return { ...item, quantity: validQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}