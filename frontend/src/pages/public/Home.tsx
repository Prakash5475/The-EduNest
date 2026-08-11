import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  BookOpen,
  ShoppingBag,
  Smartphone,
  Printer,
  Trophy,
  Headphones,
  Rocket,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/cards/ProductCard";
import { paths } from "@/routes/paths";
import { products } from "@/data/products";
import { schools } from "@/data/schools";

const FEATURES = [
  { label: "Learning System", icon: BookOpen, color: "bg-primary/10 text-primary" },
  { label: "Complete Kit Solution", icon: ShoppingBag, color: "bg-accent/20 text-edu-gray" },
  { label: "TheEduNest App", icon: Smartphone, color: "bg-success/10 text-success" },
  { label: "Printing & Branding", icon: Printer, color: "bg-secondary/10 text-secondary" },
  { label: "Awards & Recognition", icon: Trophy, color: "bg-purple-100 text-purple-600" },
  { label: "Teacher Training & Support", icon: Headphones, color: "bg-primary/10 text-primary" },
];

const TESTIMONIALS = [
  {
    quote: "Ordering supplies for the new session used to take weeks. With EduNest it takes a single afternoon.",
    name: "Dr. Rakesh Sharma",
    role: "Principal, Greenfield Academy",
  },
  {
    quote: "The quotation comparison tool alone has saved our procurement team thousands of rupees every term.",
    name: "Mrs. Anjali Deshpande",
    role: "Administrator, Sunrise Public School",
  },
  {
    quote: "Our teachers finally have consistent, curriculum-aligned kits delivered right on schedule.",
    name: "Sr. Teresa Fernandes",
    role: "Principal, St. Mary's Convent",
  },
];

export default function Home() {
  const featured = products.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/10 via-background to-background">
        <div className="container grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-edu-gray">
              <Rocket className="h-3.5 w-3.5" /> Empowering Preschools
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl">
              Nurturing <span className="text-primary">Today</span>,<br />
              Empowering <span className="text-secondary">Tomorrow</span>.
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              We simplify preschool management and enrich learning experiences — from complete kits
              to curriculum, branding, and everything schools need to run smoothly.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link to={paths.categories}>
                  Explore Our Solutions <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2">
                <Link to={paths.shop}>
                  <ShoppingBag className="h-4 w-4" /> Shop With Us
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Trusted by {schools.length * 50}+ Schools
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-secondary" /> NCF & NCP Aligned
              </span>
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" /> Designed for Preschool Success
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-elevated">
              <img
                src="https://picsum.photos/seed/edunest-hero-child/900/900"
                alt="Preschool child building blocks"
                className="aspect-square w-full object-cover"
              />
            </div>
            <Card className="absolute -bottom-6 -left-6 hidden max-w-[220px] p-4 sm:block">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-edu-gray">
                <Rocket className="h-4 w-4" />
              </span>
              <p className="mt-2 text-sm font-semibold">Building Strong Foundations for Bright Futures.</p>
            </Card>
          </div>
        </div>

        {/* Feature strip */}
        <div className="border-t border-border bg-card">
          <div className="container grid grid-cols-2 gap-6 py-8 sm:grid-cols-3 lg:grid-cols-6">
            {FEATURES.map(({ label, icon: Icon, color }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-xs font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">New Arrivals</p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Latest school essentials</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to={paths.shop}>View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">What Schools Say</p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Trusted by educators nationwide</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="p-6">
                <div className="mb-3 flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <Card className="flex flex-col items-center gap-5 bg-primary p-10 text-center text-primary-foreground sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold">Ready to simplify your procurement?</h3>
            <p className="mt-1 text-primary-foreground/85">
              Join 500+ schools already partnering with The EduNest.
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shrink-0 gap-2 bg-white text-primary hover:bg-white/90">
            <Link to={paths.requestQuotation}>
              Request a Quotation <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
