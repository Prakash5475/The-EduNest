import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paths } from "@/routes/paths";
import { curriculumPrograms, curriculumAddOns } from "@/data/curriculum";

export default function CurriculumSolutions() {
  return (
    <div>
      <section className="bg-gradient-to-b from-secondary/10 via-background to-background py-16">
        <div className="container max-w-3xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <GraduationCap className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-secondary">Curriculum Solutions</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            NCF-aligned learning programs built for every age group
          </h1>
          <p className="mt-4 text-muted-foreground">
            From sensory play for toddlers to school-readiness for 6-year-olds — structured, teacher-friendly
            curriculum programs backed by training and assessment tools.
          </p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {curriculumPrograms.map((program) => (
            <Card key={program.id} className="flex flex-col overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img src={program.image} alt={program.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <Badge variant="secondary" className="w-fit">{program.ageGroup}</Badge>
                <p className="mt-3 font-display text-xl font-semibold">{program.name}</p>
                <p className="mt-1 text-sm font-medium text-primary">{program.tagline}</p>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{program.description}</p>
                <ul className="mt-4 space-y-2">
                  {program.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{h}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-6 w-full" asChild>
                  <Link to={paths.requestQuotation}>Get Curriculum Pricing</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-14">
        <div className="container">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Add-Ons</p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Extend any curriculum program</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {curriculumAddOns.map((addon) => (
              <Card key={addon.id} className="p-6">
                <p className="font-display text-base font-semibold">{addon.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{addon.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <Card className="flex flex-col items-center gap-5 bg-secondary p-10 text-center text-secondary-foreground sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold">Ready to bring structure to your classrooms?</h3>
            <p className="mt-1 text-secondary-foreground/85">Talk to our curriculum team about a plan for your school.</p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shrink-0 gap-2 bg-white text-secondary hover:bg-white/90">
            <Link to={paths.requestQuotation}>
              Request Quotation <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}
