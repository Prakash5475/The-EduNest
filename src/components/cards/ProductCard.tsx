import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paths } from "@/routes/paths";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-elevated">
      <Link to={paths.productDetails(product.id)} className="relative block aspect-square overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.tag && (
          <Badge variant="default" className="absolute left-3 top-3">
            {product.tag}
          </Badge>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(product.id, product.name);
          }}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-soft transition-colors hover:text-primary ${
            wishlisted ? "text-primary" : "text-foreground"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted-foreground">{product.subCategory}</p>
        <Link to={paths.productDetails(product.id)}>
          <p className="mt-0.5 line-clamp-1 text-sm font-semibold hover:text-primary">{product.name}</p>
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-base font-semibold text-primary">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={() => addItem(product)}
            disabled={product.stockStatus === "out-of-stock"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Min. order: {product.minOrderQty} {product.unit}
        </p>
      </div>
    </Card>
  );
}
