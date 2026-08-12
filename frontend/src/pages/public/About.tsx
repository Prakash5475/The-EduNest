import { ShieldCheck, Target, Users, Award, Linkedin, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { schools } from "@/data/schools";
import { dealers } from "@/data/dealers";

const STATS = [
  { label: "Partner Schools", value: `${schools.length * 50}+`, icon: Users },
  { label: "Dealer Network", value: `${dealers.length * 15}+`, icon: ShieldCheck },
  { label: "Products Catalogued", value: "2,500+", icon: Target },
  { label: "Years of Trust", value: "12+", icon: Award },
];

const FOUNDER = {
  name: "Madhav Jaybhaye",
  role: "Founder",
  linkedin: "#",
};

const TEAM = [
  { name: "Yogita Sharma", role: "Team Member", linkedin: "#" },
  { name: "Tamanna Thakur", role: "Team Member", linkedin: "#https://www.linkedin.com/in/tamanna-thakur" },
  { name: "Riya", role: "Team Member", linkedin: "#" },
  { name: "", role: "Team Member", linkedin: "#" },
  { name: "Yashi", role: "Team Member", linkedin: "#" },
  { name: "Swati Panduche", role: "Team Member", linkedin: "#" },
  { name: "Prakash Musmade", role: "Team Member", linkedin: "#" },
  { name: "Devyani Khandat", role: "Team Member", linkedin: "#" },
  { name: "Swapnil Maske", role: "Team Member", linkedin: "#" },
  { name: "Pooja Nair", role: "Team Member", linkedin: "#" },
];

function TeamCard({
  name,
  role,
  linkedin,
  featured = false,
}: {
  name: string;
  role: string;
  linkedin: string;
  featured?: boolean;
}) {
  return (
    <Card
      className={`flex flex-col items-center gap-3 p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-md ${
        featured ? "border-2 border-primary" : ""
      }`}
    >
      <div className="flex aspect-[4/3.4] w-full items-center justify-center rounded-lg bg-muted">
        <User className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-0.5 text-xs font-medium text-primary">{role}</p>
      </div>
      <a
        href={linkedin}
        aria-label={`${name} on LinkedIn`}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Linkedin className="h-3.5 w-3.5" />
      </a>
    </Card>
  );
}

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

      {/* Meet the Team */}
      <section className="py-16">
        <div className="container max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Our Team</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            The Minds Behind The EduNest.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Thinkers, creators, and problem-solvers coming together to make preschool simpler, smarter, and better.
          </p>
        </div>

        {/* Founder */}
        <div className="container mt-12">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-primary">
            Founder
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-52">
              <TeamCard featured {...FOUNDER} />
            </div>
          </div>
        </div>

        {/* Team grid */}
        <div className="container mt-14">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-primary">
            Our Team
          </p>
          <div className="mx-auto mt-1 mb-8 h-0.5 w-6 rounded-full bg-primary" />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {TEAM.map((member) => (
              <TeamCard key={member.name} {...member} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
