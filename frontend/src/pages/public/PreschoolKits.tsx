import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { paths } from "@/routes/paths";
import { listKits } from "@/services/kitService";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function PreschoolKits() {
  const navigate = useNavigate();
  const { addKitItem } = useCart();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["kits"],
    queryFn: () => listKits(1, 30),
  });
  const kits = data?.items ?? [];

  async function addKitToCart(kitId: string, name: string) {
    try {
      await addKitItem(kitId, name, 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add this kit");
      navigate("/login", { state: { from: paths.preschoolKits } });
    }
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-secondary/10 via-background to-background py-16">
        <div className="container max-w-3xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Package className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-secondary">Complete Preschool Kits</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Everything your classroom needs, bundled and ready
          </h1>
          <p className="mt-4 text-muted-foreground">
            Age-appropriate kits combining learning materials, stationery, and activity sets — priced
            below buying each item separately.
          </p>
        </div>
      </section>

      <section className="container py-14">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Package}
            title="Couldn't load kits"
            description="Something went wrong reaching the catalog. Please try again."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        ) : kits.length === 0 ? (
          <EmptyState icon={Package} title="No kits available yet" description="Check back soon." />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {kits.map((kit) => {
              const image = kit.kitImages?.[0]?.uploadedFile?.filePath ?? "/placeholder-product.png";
              return (
                <Card key={kit.id} className="flex flex-col overflow-hidden">
                  <div className="relative h-52 overflow-hidden">
                    <img src={image} alt={kit.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {kit.ageGroup && <Badge variant="secondary" className="w-fit">{kit.ageGroup}</Badge>}
                    <p className="mt-3 font-display text-xl font-semibold">{kit.name}</p>
                    {kit.description && <p className="mt-1 text-sm text-muted-foreground">{kit.description}</p>}

                    <ul className="mt-4 flex-1 space-y-2">
                      {kit.kitProducts.map((item) => (
                        <li key={item.product.id} className="flex items-start justify-between gap-2 text-sm">
                          <span className="flex items-start gap-2 text-muted-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {item.product.name}
                            {item.isOptional && " (optional)"}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">×{item.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-semibold text-primary">
                        {kit.price !== null ? formatCurrency(kit.price) : "Contact us"}
                      </span>
                      {kit.price !== null && kit.referencePrice > kit.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(kit.referencePrice)}
                        </span>
                      )}
                    </div>

                    <Button
                      className="mt-4 w-full gap-2"
                      disabled={kit.price === null}
                      onClick={() => addKitToCart(kit.id, kit.name)}
                    >
                      <ShoppingCart className="h-4 w-4" /> Add Kit to Cart
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="container pb-16">
        <Card className="flex flex-col items-center gap-5 bg-secondary p-10 text-center text-secondary-foreground sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold">Need a custom kit for your school?</h3>
            <p className="mt-1 text-secondary-foreground/85">We can tailor a kit to your exact classroom count and curriculum.</p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shrink-0 gap-2 bg-white text-secondary hover:bg-white/90">
            <Link to={paths.requestQuotation}>
              Request Custom Kit <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}

