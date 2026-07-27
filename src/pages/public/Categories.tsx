import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { paths } from "@/routes/paths";
import { products, categories } from "@/data/products";

const CATEGORY_IMAGES: Record<string, string> = {
  "Books & Notes": "https://picsum.photos/seed/cat-books/500/400",
  Stationery: "https://picsum.photos/seed/cat-stationery/500/400",
  Uniforms: "https://picsum.photos/seed/cat-uniforms/500/400",
  "Bags & Luggage": "https://picsum.photos/seed/cat-bags/500/400",
  "Art & Craft": "https://picsum.photos/seed/cat-art/500/400",
  Sports: "https://picsum.photos/seed/cat-sports/500/400",
  Electronics: "https://picsum.photos/seed/cat-electronics/500/400",
};

export default function Categories() {
  return (
    <div className="container py-10">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Browse</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Shop by Category</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Every essential your school needs, organized for fast bulk ordering.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const count = products.filter((p) => p.category === cat).length;
          return (
            <Link key={cat} to={`${paths.shop}?category=${encodeURIComponent(cat)}`}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-elevated">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={CATEGORY_IMAGES[cat]}
                    alt={cat}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-4 font-display text-lg font-semibold text-white">{cat}</p>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-muted-foreground">{count} products</span>
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
