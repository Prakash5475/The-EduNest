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

interface WishlistContextValue {
  ids: string[];
  toggle: (productId: string, productName?: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "edunest.wishlist.v1";

function readInitial(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(readInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable — wishlist still works in-memory.
    }
  }, [ids]);

  const toggle = useCallback((productId: string, productName?: string) => {
    setIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        toast.info(productName ? `${productName} removed from wishlist` : "Removed from wishlist");
        return prev.filter((id) => id !== productId);
      }
      toast.success(productName ? `${productName} added to wishlist` : "Added to wishlist");
      return [...prev, productId];
    });
  }, []);

  const isWishlisted = useCallback((productId: string) => ids.includes(productId), [ids]);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(() => ({ ids, toggle, isWishlisted, clear }), [ids, toggle, isWishlisted, clear]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
