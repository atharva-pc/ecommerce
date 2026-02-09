"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    title: string;
    price: number;
    preview_url: string;
    description: string;
    is_limited_edition?: boolean;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const supabase = createClient();

  // Get or create session ID for non-logged-in users
  const getSessionId = () => {
    let sessionId = localStorage.getItem("cart_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("cart_session_id", sessionId);
    }
    return sessionId;
  };

  const refreshCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // For now, if tables don't exist, just set empty cart
      // This prevents errors before database schema is run
      let query = supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            title,
            price,
            preview_url,
            description,
            is_limited_edition
          )
        `);

      if (user) {
        query = query.eq("user_id", user.id);
      } else {
        const sessionId = getSessionId();
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query;

      if (error) {
        // Table might not exist yet - just log and set empty cart
        console.warn("Cart table not ready yet. Run DATABASE_SCHEMA.sql in Supabase.", error.message);
        setCartItems([]);
        setCartCount(0);
        return;
      }

      const items = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: Array.isArray(item.products) ? item.products[0] : item.products,
      }));

      setCartItems(items);
      setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      // Gracefully handle any errors
      console.warn("Cart functionality requires database setup. See DATABASE_SCHEMA.sql");
      setCartItems([]);
      setCartCount(0);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if item already in cart
      let existingItem;
      if (user) {
        const { data } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .maybeSingle();
        existingItem = data;
      } else {
        const sessionId = getSessionId();
        const { data } = await supabase
          .from("cart_items")
          .select("*")
          .eq("session_id", sessionId)
          .eq("product_id", productId)
          .maybeSingle();
        existingItem = data;
      }

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Insert new item
        const insertData: {
          product_id: string;
          quantity: number;
          user_id?: string;
          session_id?: string;
        } = {
          product_id: productId,
          quantity,
        };

        if (user) {
          insertData.user_id = user.id;
        } else {
          insertData.session_id = getSessionId();
        }

        const { error } = await supabase.from("cart_items").insert(insertData);

        if (error) {
          console.warn("Cart table not ready. Run DATABASE_SCHEMA.sql in Supabase.");
          throw new Error("Cart functionality requires database setup");
        }

        await refreshCart();
      }
    } catch (error) {
      console.warn("Add to cart failed. Make sure to run DATABASE_SCHEMA.sql");
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);

      if (error) {
        console.error("Error removing from cart:", error);
        return;
      }

      await refreshCart();
    } catch {
      console.warn("Error in removeFromCart");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      // Physical artwork - max quantity is 1
      // If user wants more, they need to request a commission
      if (quantity > 1) {
        // Show commission popup (handled in component)
        return;
      }

      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) {
        console.error("Error updating quantity:", error);
        return;
      }

      await refreshCart();
    } catch {
      console.warn("Error in updateQuantity");
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      } else {
        const sessionId = getSessionId();
        await supabase.from("cart_items").delete().eq("session_id", sessionId);
      }

      await refreshCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadCart = async () => {
      if (mounted) {
        await refreshCart();
      }
    };

    loadCart();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        refreshCart();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
