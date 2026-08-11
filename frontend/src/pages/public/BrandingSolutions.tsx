import { Link } from "react-router-dom";
import {
  ArrowRight,
  Palette,
  Signpost,
  Shirt,
  Printer,
  Sofa,
  Smartphone,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paths } from "@/routes/paths";
import { brandingServices, brandingPortfolio } from "@/data/branding";
import type { BrandingService } from "@/data/branding";

const ICONS: Record<BrandingService["icon"], typeof Signpost> = {
  signage: Signpost,
  uniform: Shirt,
  print: Printer,
  interior: Sofa,
  digital: Smartphone,
  merch: Gift,
};

const PROCESS_STEPS = [
  { step: "01", title: "Discovery Call", description: "We learn about your school's identity, values, and existing brand assets." },
  { step: "02", title: "Design Concepts", description: "Our design team presents 2–3 concept directions tailored to your campus." },
  { step: "03", title: "Production", description: "Approved designs move to production — signage, print, uniforms, or interiors." },
  { step: "04", title: "Installation", description: "Our team handles on-site installation and final walkthroughs with you." },
];

export default function BrandingSolutions() {
  return (
    <div>
      <section className="bg-gradient-to-b from-accent/10 via-background to-background py-16">
        <div className="container max-w-3xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-edu-gray">
            <Palette className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">Branding Solutions</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Give your campus an identity children love
          </h1>
          <p className="mt-4 text-muted-foreground">
            From classroom signage to full campus rebrands — our design and production team brings your
            school's identity to life, end to end.
          </p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brandingServices.map((service) => {
            const Icon = ICONS[service.icon];
            return (
              <Card key={service.id} className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-base font-semibold">{service.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/40 py-14">
        <div className="container">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Portfolio</p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Recent campus transformations</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brandingPortfolio.map((item) => (
              <Card key={item.id} className="group overflow-hidden">
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.school}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <Badge className="absolute left-3 top-3">{item.category}</Badge>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold">{item.school}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-14">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Our Process</p>
          <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">From concept to campus</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((s) => (
            <Card key={s.step} className="p-6">
              <p className="font-display text-3xl font-semibold text-primary/30">{s.step}</p>
              <p className="mt-2 text-sm font-semibold">{s.title}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <Card className="flex flex-col items-center gap-5 bg-primary p-10 text-center text-primary-foreground sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold">Let's design your campus identity</h3>
            <p className="mt-1 text-primary-foreground/85">Book a free discovery call with our branding team.</p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shrink-0 gap-2 bg-white text-primary hover:bg-white/90">
            <Link to={paths.requestQuotation}>
              Request Quotation <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
