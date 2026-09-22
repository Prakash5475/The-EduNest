import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";

export default function Wishlist() {
  const { lines, toggle, moveToCart } = useWishlist();

  async function handleMoveToCart(productId: string, name: string) {
    try {
      await moveToCart(productId);
      toast.success(`${name} moved to cart`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't move this item to cart");
    }
  }

  return (
    <div>
      <PageHeader title="Wishlist" description="Products you've saved for later." />

      {lines.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart icon on any product to save it here for later."
          actionLabel="Browse Shop"
          onAction={() => (window.location.href = paths.shop)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((line) => (
            <Card key={line.productId} className="flex gap-4 p-4">
              <Link to={`${paths.shop}/${line.productId}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                <img src={line.image ?? "/placeholder-product.png"} alt={line.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link to={`${paths.shop}/${line.productId}`} className="text-sm font-semibold hover:text-primary">
                    {line.name}
                  </Link>
                  {line.price !== undefined && (
                    <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(line.price)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => handleMoveToCart(line.productId, line.name)}>
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => toggle(line.productId, line.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

