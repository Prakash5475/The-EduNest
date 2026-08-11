import { useState } from "react";
import { Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TicketPriorityBadge } from "@/components/common/TicketPriorityBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listAllTickets,
  replyToTicket,
  updateTicketStatus,
  updateTicketPriority,
  type ApiSupportTicket,
  type SupportStatus,
  type SupportPriority,
} from "@/services/supportService";
import { formatDate } from "@/lib/utils";

type FilterTab = "all" | SupportStatus;
const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Waiting on Customer", value: "waiting_on_customer" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];
const STATUS_OPTIONS: SupportStatus[] = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
const PRIORITY_OPTIONS: SupportPriority[] = ["low", "medium", "high", "urgent"];

export default function Support() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<ApiSupportTicket | null>(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support-tickets", tab],
    queryFn: () => listAllTickets(1, 100, tab === "all" ? undefined : tab),
  });
  const tickets = data?.items ?? [];
  const activeTicket = selected ? tickets.find((t) => t.id === selected.id) ?? selected : null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  }

  const replyMutation = useMutation({
    mutationFn: ({ id, msg }: { id: string; msg: string }) => replyToTicket(id, msg),
    onSuccess: () => {
      invalidate();
      toast.success("Reply sent");
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportStatus }) => updateTicketStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
  });
  const priorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: SupportPriority }) => updateTicketPriority(id, priority),
    onSuccess: () => {
      invalidate();
      toast.success("Priority updated");
    },
  });

  async function handleReply() {
    if (!activeTicket || !message.trim()) return;
    await replyMutation.mutateAsync({ id: activeTicket.id, msg: message });
    setMessage("");
  }

  return (
    <div>
      <PageHeader title="Support" description="Manage customer and dealer support tickets." />

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList className="mb-5 flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : tickets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No tickets in this view.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tickets.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{t.subject}</p>
                <TicketPriorityBadge priority={t.priority} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.ticketNumber} · {t.school?.schoolName ?? t.dealer?.businessName ?? "—"} · {formatDate(t.createdAt)}
              </p>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={t.status} />
                <Button variant="ghost" size="sm" onClick={() => setSelected(t)}>
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!activeTicket} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="max-w-xl">
          {activeTicket && (
            <>
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle>{activeTicket.subject}</SheetTitle>
                  <StatusBadge status={activeTicket.status} />
                  <TicketPriorityBadge priority={activeTicket.priority} />
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Ticket ID</p>
                  <p className="font-medium">{activeTicket.ticketNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Raised By</p>
                  <p className="font-medium">{activeTicket.school?.schoolName ?? activeTicket.dealer?.businessName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{activeTicket.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date Raised</p>
                  <p className="font-medium">{formatDate(activeTicket.createdAt)}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{activeTicket.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <Select
                    value={activeTicket.status}
                    onValueChange={(v) => statusMutation.mutate({ id: activeTicket.id, status: v as SupportStatus })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Priority</p>
                  <Select
                    value={activeTicket.priority}
                    onValueChange={(v) => priorityMutation.mutate({ id: activeTicket.id, priority: v as SupportPriority })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-3 text-sm font-semibold">Conversation</p>
                <div className="max-h-64 space-y-3 overflow-y-auto scrollbar-thin">
                  {activeTicket.ticketReplies.length === 0 && (
                    <p className="text-xs text-muted-foreground">No replies yet.</p>
                  )}
                  {activeTicket.ticketReplies.map((r) => (
                    <div key={r.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{r.user?.fullName ?? "Support Team"}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{r.message}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="Write a reply…"
                    className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button size="icon" aria-label="Send reply" onClick={handleReply} disabled={replyMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

