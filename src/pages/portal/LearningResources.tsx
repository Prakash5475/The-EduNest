import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { learningResources } from "@/data/learningResources";

const TYPES = ["All", "Article", "Guide", "Video", "Worksheet"] as const;

export default function LearningResources() {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("All");

  const filtered = useMemo(
    () => (typeFilter === "All" ? learningResources : learningResources.filter((r) => r.type === typeFilter)),
    [typeFilter]
  );

  return (
    <div>
      <PageHeader title="Learning Resources" description="Guides, articles, and downloadable materials for your teaching staff." />

      <div className="mb-6 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              typeFilter === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Card key={r.id} className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-elevated">
            <div className="relative h-40 overflow-hidden">
              <img src={r.image} alt={r.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <Badge className="absolute left-3 top-3">{r.type}</Badge>
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-primary">{r.category}</p>
              <p className="mt-1 text-sm font-semibold leading-snug">{r.title}</p>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{r.summary}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {r.readTime}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
