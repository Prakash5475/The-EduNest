import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Product } from "@/types";

export interface CartLine {
  productId: string;
  name: string;
  image: string;
  price: number;
  unit: string;
  minOrderQty: number;
  qty: number;
  color?: string;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (product: Product, qty?: number, color?: string) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "edunest.cart.v1";

function readInitialCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readInitialCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage unavailable (e.g. private browsing) — cart still works in-memory.
    }
  }, [lines]);

  const addItem = useCallback((product: Product, qty = product.minOrderQty, color?: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id && l.color === color);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id && l.color === color ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          image: product.images[0],
          price: product.price,
          unit: product.unit,
          minOrderQty: product.minOrderQty,
          qty,
          color,
        },
      ];
    });
    toast.success(`${product.name} added to cart`);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty: Math.max(l.minOrderQty, qty) } : l))
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const subTotal = useMemo(() => lines.reduce((sum, l) => sum + l.qty * l.price, 0), [lines]);

  const value = useMemo(
    () => ({ lines, addItem, removeItem, updateQty, clearCart, itemCount, subTotal }),
    [lines, addItem, removeItem, updateQty, clearCart, itemCount, subTotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
