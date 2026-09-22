import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCartApi, type ApiCart } from "@/services/cartService";

export interface CartLine {
  productId: string;
  itemId?: string; // present when backed by a real cart item (authenticated school)
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
  isSyncing: boolean;
  addItem: (product: Product, qty?: number, color?: string) => void;
  addKitItem: (kitId: string, name: string, qty: number) => Promise<void>;
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

function apiCartToLines(cart: ApiCart): CartLine[] {
  return cart.cartItems.map((item) => ({
    productId: item.productId ?? item.id,
    itemId: item.id,
    name: item.product?.name ?? "Product",
    image: item.product?.productImages?.[0]?.uploadedFile?.filePath ?? "/placeholder-product.png",
    price: Number(item.unitPriceSnapshot),
    unit: "pcs",
    minOrderQty: item.product?.minOrderQty ?? 1,
    qty: item.quantity,
    color: item.productVariant?.attributeSummary ?? undefined,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const isSchoolMode = isAuthenticated && user?.userType === "school";
  const queryClient = useQueryClient();

  const [guestLines, setGuestLines] = useState<CartLine[]>(readInitialCart);
  const mergedRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guestLines));
    } catch {
      // Storage unavailable — cart still works in-memory for this tab.
    }
  }, [guestLines]);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isSchoolMode,
    staleTime: 30_000,
  });

  // One-time merge of any guest-cart items into the real backend cart on login.
  useEffect(() => {
    if (!isSchoolMode || mergedRef.current || guestLines.length === 0) return;
    mergedRef.current = true;
    (async () => {
      for (const line of guestLines) {
        try {
          await addCartItem({ productId: line.productId, quantity: line.qty });
        } catch {
          // Skip lines that fail to merge (e.g. product no longer available) rather than blocking login.
        }
      }
      setGuestLines([]);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    })();
  }, [isSchoolMode, guestLines, queryClient]);

  const invalidateCart = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [queryClient]);

  const addMutation = useMutation({ mutationFn: addCartItem, onSuccess: invalidateCart });
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    onSuccess: invalidateCart,
  });
  const removeMutation = useMutation({ mutationFn: removeCartItem, onSuccess: invalidateCart });
  const clearMutation = useMutation({ mutationFn: clearCartApi, onSuccess: invalidateCart });

  const lines = useMemo(() => {
    if (isSchoolMode) return cartQuery.data ? apiCartToLines(cartQuery.data) : [];
    return guestLines;
  }, [isSchoolMode, cartQuery.data, guestLines]);

  const addItem = useCallback(
    (product: Product, qty = product.minOrderQty, color?: string) => {
      if (isSchoolMode) {
        addMutation.mutate({ productId: product.id, quantity: qty });
        toast.success(`${product.name} added to cart`);
        return;
      }
      setGuestLines((prev) => {
        const existing = prev.find((l) => l.productId === product.id && l.color === color);
        if (existing) {
          return prev.map((l) => (l.productId === product.id && l.color === color ? { ...l, qty: l.qty + qty } : l));
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
    },
    [isSchoolMode, addMutation],
  );

  const addKitItem = useCallback(
    async (kitId: string, name: string, qty: number) => {
      if (!isSchoolMode) {
        throw new Error("Please sign in with a school account to add kits to your cart.");
      }
      await addMutation.mutateAsync({ kitId, quantity: qty });
      toast.success(`${name} added to cart`);
    },
    [isSchoolMode, addMutation],
  );

  const removeItem = useCallback(
    (productId: string) => {
      if (isSchoolMode) {
        const line = lines.find((l) => l.productId === productId);
        if (line?.itemId) removeMutation.mutate(line.itemId);
        return;
      }
      setGuestLines((prev) => prev.filter((l) => l.productId !== productId));
    },
    [isSchoolMode, lines, removeMutation],
  );

  const updateQty = useCallback(
    (productId: string, qty: number) => {
      if (isSchoolMode) {
        const line = lines.find((l) => l.productId === productId);
        if (line?.itemId) updateMutation.mutate({ itemId: line.itemId, quantity: Math.max(line.minOrderQty, qty) });
        return;
      }
      setGuestLines((prev) =>
        prev.map((l) => (l.productId === productId ? { ...l, qty: Math.max(l.minOrderQty, qty) } : l)),
      );
    },
    [isSchoolMode, lines, updateMutation],
  );

  const clearCart = useCallback(() => {
    if (isSchoolMode) {
      clearMutation.mutate();
      return;
    }
    setGuestLines([]);
  }, [isSchoolMode, clearMutation]);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const subTotal = useMemo(() => lines.reduce((sum, l) => sum + l.qty * l.price, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      isSyncing: cartQuery.isFetching || addMutation.isPending || updateMutation.isPending || removeMutation.isPending,
      addItem,
      addKitItem,
      removeItem,
      updateQty,
      clearCart,
      itemCount,
      subTotal,
    }),
    [lines, cartQuery.isFetching, addMutation.isPending, updateMutation.isPending, removeMutation.isPending, addItem, addKitItem, removeItem, updateQty, clearCart, itemCount, subTotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
