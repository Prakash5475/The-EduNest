import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { QtyStepper } from "@/components/common/QtyStepper";
import { useCart } from "@/context/CartContext";
import { paths } from "@/routes/paths";
import { formatCurrency } from "@/lib/utils";

const GST_PCT = 18;

export default function Cart() {
  const { lines, updateQty, removeItem, subTotal } = useCart();
  const navigate = useNavigate();
  const gst = (subTotal * GST_PCT) / 100;
  const total = subTotal + gst;

  if (lines.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the shop to add books, uniforms, kits and more for your school."
          actionLabel="Go to Shop"
          onAction={() => navigate(paths.shop)}
        />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-display text-2xl font-semibold sm:text-3xl">Shopping Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {lines.map((line) => (
            <Card key={`${line.productId}-${line.color ?? "default"}`} className="flex items-center gap-4 p-4">
              <img src={line.image} alt={line.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{line.name}</p>
                {line.color && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    Color: <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: line.color }} />
                  </span>
                )}
                <p className="mt-1 text-sm text-primary font-medium">{formatCurrency(line.price)}</p>
                <p className="text-[11px] text-muted-foreground">Min. order: {line.minOrderQty} {line.unit}</p>
              </div>
              <QtyStepper qty={line.qty} min={line.minOrderQty} onChange={(q) => updateQty(line.productId, q)} size="sm" />
              <p className="w-24 shrink-0 text-right text-sm font-semibold">{formatCurrency(line.qty * line.price)}</p>
              <button
                onClick={() => removeItem(line.productId)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${line.name} from cart`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>

        <Card className="h-fit p-6">
          <p className="mb-4 font-display text-lg font-semibold">Order Summary</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sub Total</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({GST_PCT}%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button size="lg" className="mt-6 w-full gap-2" asChild>
            <Link to={paths.checkout}>
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="mt-3 w-full" asChild>
            <Link to={paths.requestQuotation}>Request Quotation Instead</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
