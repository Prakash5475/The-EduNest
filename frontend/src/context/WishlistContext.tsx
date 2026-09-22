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
import { useAuth } from "@/context/AuthContext";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
  type ApiWishlist,
} from "@/services/wishlistService";

export interface WishlistLine {
  productId: string;
  itemId?: string;
  name: string;
  image?: string;
  price?: number;
}

interface WishlistContextValue {
  ids: string[];
  lines: WishlistLine[];
  toggle: (productId: string, productName?: string) => void;
  isWishlisted: (productId: string) => boolean;
  moveToCart: (productId: string) => Promise<void>;
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

function apiWishlistToLines(wishlist: ApiWishlist): WishlistLine[] {
  return wishlist.wishlistItems
    .filter((item) => item.productId)
    .map((item) => ({
      productId: item.productId as string,
      itemId: item.id,
      name: item.product?.name ?? "Product",
      image: item.product?.productImages?.[0]?.uploadedFile?.filePath,
      price: item.product ? Number(item.product.basePrice) : undefined,
    }));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const isSchoolMode = isAuthenticated && user?.userType === "school";
  const queryClient = useQueryClient();

  const [guestIds, setGuestIds] = useState<string[]>(readInitial);
  const mergedRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guestIds));
    } catch {
      // Storage unavailable — wishlist still works in-memory for this tab.
    }
  }, [guestIds]);

  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: isSchoolMode,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isSchoolMode || mergedRef.current || guestIds.length === 0) return;
    mergedRef.current = true;
    (async () => {
      for (const productId of guestIds) {
        try {
          await addToWishlist(productId);
        } catch {
          // Skip items that fail to merge rather than blocking login.
        }
      }
      setGuestIds([]);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    })();
  }, [isSchoolMode, guestIds, queryClient]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  }, [queryClient]);

  const addMutation = useMutation({ mutationFn: addToWishlist, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: removeFromWishlist, onSuccess: invalidate });
  const moveMutation = useMutation({
    mutationFn: (itemId: string) => moveWishlistItemToCart(itemId),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const lines = useMemo(
    () => (isSchoolMode && wishlistQuery.data ? apiWishlistToLines(wishlistQuery.data) : []),
    [isSchoolMode, wishlistQuery.data],
  );
  const ids = useMemo(() => (isSchoolMode ? lines.map((l) => l.productId) : guestIds), [isSchoolMode, lines, guestIds]);

  const toggle = useCallback(
    (productId: string, productName?: string) => {
      if (isSchoolMode) {
        const existingLine = lines.find((l) => l.productId === productId);
        if (existingLine?.itemId) {
          removeMutation.mutate(existingLine.itemId);
          toast.info(productName ? `${productName} removed from wishlist` : "Removed from wishlist");
        } else {
          addMutation.mutate(productId);
          toast.success(productName ? `${productName} added to wishlist` : "Added to wishlist");
        }
        return;
      }
      setGuestIds((prev) => {
        const exists = prev.includes(productId);
        if (exists) {
          toast.info(productName ? `${productName} removed from wishlist` : "Removed from wishlist");
          return prev.filter((id) => id !== productId);
        }
        toast.success(productName ? `${productName} added to wishlist` : "Added to wishlist");
        return [...prev, productId];
      });
    },
    [isSchoolMode, lines, addMutation, removeMutation],
  );

  const isWishlisted = useCallback((productId: string) => ids.includes(productId), [ids]);

  const moveToCart = useCallback(
    async (productId: string) => {
      if (!isSchoolMode) {
        throw new Error("Please sign in with a school account to move items to your cart.");
      }
      const line = lines.find((l) => l.productId === productId);
      if (line?.itemId) await moveMutation.mutateAsync(line.itemId);
    },
    [isSchoolMode, lines, moveMutation],
  );

  const clear = useCallback(() => setGuestIds([]), []);

  const value = useMemo(
    () => ({ ids, lines, toggle, isWishlisted, moveToCart, clear }),
    [ids, lines, toggle, isWishlisted, moveToCart, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
