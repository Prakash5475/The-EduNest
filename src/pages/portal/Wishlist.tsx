import { Heart } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/cards/ProductCard";
import { paths } from "@/routes/paths";
import { products } from "@/data/products";
import { useWishlist } from "@/context/WishlistContext";

export default function Wishlist() {
  const { ids } = useWishlist();
  const wishlistedProducts = products.filter((p) => ids.includes(p.id));

  return (
    <div>
      <PageHeader title="Wishlist" description="Products you've saved for later." />

      {wishlistedProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart icon on any product to save it here for later."
          actionLabel="Browse Shop"
          onAction={() => (window.location.href = paths.shop)}
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
          {wishlistedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
