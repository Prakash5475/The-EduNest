import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paths } from "@/routes/paths";
import { caseStudies, successMetrics } from "@/data/caseStudies";
import { learningResources } from "@/data/learningResources";

export default function PreschoolSuccessHub() {
  const featuredResources = learningResources.slice(0, 3);

  return (
    <div>
      <section className="bg-gradient-to-b from-primary/10 via-background to-background py-16">
        <div className="container max-w-3xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">Preschool Success Hub</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Real stories from schools building brighter futures
          </h1>
          <p className="mt-4 text-muted-foreground">
            See how partner schools across India are using EduNest to simplify procurement, upgrade
            curriculum, and transform their campuses.
          </p>
        </div>
      </section>

      <section className="container -mt-6 pb-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {successMetrics.map((m) => (
            <Card key={m.label} className="flex flex-col items-center gap-1 p-6 text-center">
              <p className="font-display text-2xl font-semibold text-primary sm:text-3xl">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Case Studies</p>
          <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Success stories from our network</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {caseStudies.map((cs) => (
            <Card key={cs.id} className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-5">
                <div className="h-48 sm:col-span-2 sm:h-full">
                  <img src={cs.image} alt={cs.school} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col p-6 sm:col-span-3">
                  <Badge variant="secondary" className="w-fit">{cs.category}</Badge>
                  <p className="mt-3 font-display text-lg font-semibold leading-snug">{cs.headline}</p>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{cs.summary}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary" /> {cs.school}
                      </p>
                      <p className="text-xs text-muted-foreground">{cs.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1 font-display text-lg font-semibold text-success">
                        <TrendingUp className="h-4 w-4" /> {cs.metric.value}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{cs.metric.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-14">
        <div className="container">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Keep Learning</p>
              <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Resources to help you succeed</h2>
            </div>
            <Button variant="outline" asChild>
              <Link to={paths.portal.resources}>View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {featuredResources.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <div className="h-36 overflow-hidden">
                  <img src={r.image} alt={r.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-primary">{r.category}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug">{r.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <Card className="flex flex-col items-center gap-5 bg-primary p-10 text-center text-primary-foreground sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold">Want to be our next success story?</h3>
            <p className="mt-1 text-primary-foreground/85">Partner with EduNest and start your own transformation.</p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shrink-0 gap-2 bg-white text-primary hover:bg-white/90">
            <Link to={paths.requestQuotation}>
              Partner With Us <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
