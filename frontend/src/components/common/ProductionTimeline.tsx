import { CheckCheck, Circle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ProductionStageEvent } from "@/types";

interface ProductionTimelineProps {
  stages: ProductionStageEvent[];
  /** Compact renders a horizontal strip of dots for use inside cards/lists. */
  variant?: "vertical" | "compact";
}

export function ProductionTimeline({ stages, variant = "vertical" }: ProductionTimelineProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {stages.map((s, idx) => (
          <div key={s.stage} className="flex items-center gap-1">
            <span
              title={s.stage}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                s.completed ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {s.completed ? <CheckCheck className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
            </span>
            {idx < stages.length - 1 && (
              <span className={`h-px w-3 shrink-0 ${s.completed ? "bg-success/40" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {stages.map((s, idx) => {
        const isLast = idx === stages.length - 1;
        return (
          <li key={s.stage} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  s.completed ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.completed ? <CheckCheck className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </span>
              {!isLast && <span className={`mt-1 h-8 w-px flex-1 ${s.completed ? "bg-success/40" : "bg-border"}`} />}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-semibold ${s.completed ? "text-foreground" : "text-muted-foreground"}`}>
                {s.stage}
              </p>
              <p className="text-xs text-muted-foreground">{s.date ? formatDate(s.date) : "Pending"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
