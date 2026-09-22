import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_STYLE: Record<string, string> = {
  Low: "border-transparent bg-muted text-muted-foreground",
  Medium: "border-transparent bg-secondary/10 text-secondary",
  High: "border-transparent bg-warning/15 text-warning",
  Urgent: "border-transparent bg-destructive/10 text-destructive",
  low: "border-transparent bg-muted text-muted-foreground",
  medium: "border-transparent bg-secondary/10 text-secondary",
  high: "border-transparent bg-warning/15 text-warning",
  urgent: "border-transparent bg-destructive/10 text-destructive",
};

export function TicketPriorityBadge({ priority }: { priority: string }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return <Badge className={cn(PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.Medium)}>{label}</Badge>;
}
