import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  changePct?: number;
  icon: LucideIcon;
  iconColorClass?: string;
  sparkline?: ReactNode;
}

export function StatCard({ label, value, changePct, icon: Icon, iconColorClass, sparkline }: StatCardProps) {
  const isPositive = (changePct ?? 0) >= 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            iconColorClass ?? "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {changePct !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(changePct)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {sparkline && <div className="mt-3 h-10">{sparkline}</div>}
    </Card>
  );
}
