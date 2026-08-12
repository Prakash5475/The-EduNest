import { ShieldCheck, Target, Users, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { schools } from "@/data/schools";
import { dealers } from "@/data/dealers";

const STATS = [
  { label: "Partner Schools", value: `${schools.length * 50}+`, icon: Users },
  { label: "Dealer Network", value: `${dealers.length * 15}+`, icon: ShieldCheck },
  { label: "Products Catalogued", value: "2,500+", icon: Target },
  { label: "Years of Trust", value: "12+", icon: Award },
];

export default function About() {
  return (
    <div>
      <section className="bg-gradient-to-b from-accent/10 via-background to-background py-16">
        <div className="container max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">About The EduNest</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Complete Solutions for Brighter Preschool Journeys.
          </h1>
          <p className="mt-4 text-muted-foreground">
            The EduNest brings learning, school essentials, branding, and technology together in one complete ecosystem for preschools. We help schools simplify everyday operations, strengthen their identity, and create joyful, well-organized learning experiences where every child comes first.

          </p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="flex flex-col items-center gap-2 p-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-display text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-14">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="p-8">
            <h2 className="font-display text-xl font-semibold">Our Mission</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              To empower preschools with complete, child-centered solutions that simplify school management, enhance learning, 
              strengthen school identity, and create a joyful, connected experience for children, teachers, and parents.
            </p>
          </Card>
          <Card className="p-8">
            <h2 className="font-display text-xl font-semibold">Our Approach</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We bring learning, school essentials, branding, technology, and ongoing support together under one integrated ecosystem,
               helping preschools save time, reduce stress, maintain consistency, and deliver better learning experiences.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
