import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ShoppingCart, Heart, ChevronRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { QtyStepper } from "@/components/common/QtyStepper";
import { ProductCard } from "@/components/cards/ProductCard";
import { paths } from "@/routes/paths";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(product?.minOrderQty ?? 1);
  const [activeColor, setActiveColor] = useState<string | undefined>(product?.colors?.[0]);

  if (!product) {
    return <Navigate to={paths.shop} replace />;
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to={paths.shop} className="hover:text-primary">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`${paths.shop}?category=${encodeURIComponent(product.category)}`} className="hover:text-primary">
          {product.category}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
            <img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          <div className="mt-4 flex gap-3">
            {product.images.map((img, idx) => (
              <button
                key={img}
                onClick={() => setActiveImage(idx)}
                className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                  idx === activeImage ? "border-primary" : "border-border"
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          {product.tag && <Badge className="mb-3">{product.tag}</Badge>}
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.brand} · {product.subCategory}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-3xl font-semibold text-primary">{formatCurrency(product.price)}</span>
            <Badge variant={product.stockStatus === "in-stock" ? "success" : product.stockStatus === "low-stock" ? "warning" : "destructive"}>
              {product.stockStatus === "in-stock" ? "In Stock" : product.stockStatus === "low-stock" ? "Low Stock" : "Out of Stock"}
            </Badge>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>

          {product.colors && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Color</p>
              <div className="flex gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveColor(c)}
                    className={`h-8 w-8 rounded-full border-2 ${activeColor === c ? "border-primary" : "border-border"}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Quantity</p>
            <QtyStepper qty={qty} min={product.minOrderQty} onChange={setQty} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Minimum order: {product.minOrderQty} {product.unit} · SKU {product.sku}
            </p>
          </div>

          <div className="mt-7 flex gap-3">
            <Button
              size="lg"
              className="flex-1 gap-2"
              disabled={product.stockStatus === "out-of-stock"}
              onClick={() => addItem(product, qty, activeColor)}
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => toggle(product.id, product.name)}>
              <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? "fill-current text-primary" : ""}`} />
              {isWishlisted(product.id) ? "Wishlisted" : "Wishlist"}
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 rounded-2xl border border-border p-4 sm:grid-cols-3">
            <InfoPill icon={Truck} text="Bulk delivery to school" />
            <InfoPill icon={ShieldCheck} text="Quality checked" />
            <InfoPill icon={RotateCcw} text="Easy returns" />
          </div>

          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="description">
              <AccordionTrigger>Product Description</AccordionTrigger>
              <AccordionContent>{product.description}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="specs">
              <AccordionTrigger>Specifications</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  <SpecRow label="SKU" value={product.sku} />
                  <SpecRow label="Brand" value={product.brand} />
                  <SpecRow label="HSN Code" value={product.hsnCode} />
                  <SpecRow label="Unit" value={product.unit} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping & Returns</AccordionTrigger>
              <AccordionContent>
                Bulk orders are dispatched within 3–5 business days of confirmed payment. Returns are
                accepted within 7 days for unopened, unused stock.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>Care Instructions</AccordionTrigger>
              <AccordionContent>
                Store in a cool, dry place. Refer to packaging for any product-specific care
                guidance.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-xl font-semibold">You may also need</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoPill({ icon: Icon, text }: { icon: typeof Truck; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0 text-primary" /> {text}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
