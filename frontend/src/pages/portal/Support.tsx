import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy, Mail, Phone, MessageSquareText, Send } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TicketPriorityBadge } from "@/components/common/TicketPriorityBadge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { listFaqs } from "@/services/faqService";
import type { ApiSupportTicket, SupportCategory, SupportPriority } from "@/services/supportService";
import { formatDate } from "@/lib/utils";

const CATEGORIES: { label: string; value: SupportCategory }[] = [
  { label: "Order", value: "order" },
  { label: "Payment", value: "payment" },
  { label: "Product", value: "product" },
  { label: "Account", value: "account" },
  { label: "Technical", value: "technical" },
  { label: "Other", value: "other" },
];
const PRIORITIES: SupportPriority[] = ["low", "medium", "high", "urgent"];

export default function Support() {
  const { tickets, loading, submitTicket, reply, isSubmitting, isReplying } = useSupportTickets();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportCategory>("order");
  const [priority, setPriority] = useState<SupportPriority>("medium");
  const [selected, setSelected] = useState<ApiSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: faqs = [] } = useQuery({ queryKey: ["faqs"], queryFn: listFaqs, staleTime: 10 * 60 * 1000 });

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;
    await submitTicket({ subject, description: message, category, priority });
    setSubject("");
    setMessage("");
  }

  async function handleReply() {
    if (!selected || !replyMessage.trim()) return;
    await reply(selected.id, replyMessage);
    setReplyMessage("");
  }

  const liveSelected = selected ? tickets.find((t) => t.id === selected.id) ?? selected : null;

  return (
    <div>
      <PageHeader title="Support Center" description="Get help with orders, payments, or your account." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Phone className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Call Us</p>
            <p className="text-sm font-semibold">+91 98765 43210</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Mail className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Email Us</p>
            <p className="text-sm font-semibold">support@theedunest.com</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-edu-gray">
            <LifeBuoy className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Support Hours</p>
            <p className="text-sm font-semibold">Mon–Sat, 9 AM – 7 PM</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="mb-4 font-display text-lg font-semibold">Frequently Asked Questions</p>
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No FAQs published yet.</p>
          ) : (
            <Accordion type="single" collapsible>
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="mb-1 flex items-center gap-2 font-display text-base font-semibold">
              <MessageSquareText className="h-4.5 w-4.5 text-primary" /> Raise a Ticket
            </p>
            <p className="mb-4 text-xs text-muted-foreground">Can't find what you're looking for? Send us a message.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as SupportCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as SupportPriority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe your issue..."
                  className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit Ticket"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <p className="mb-3 text-sm font-semibold">Your Tickets</p>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : tickets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tickets raised yet.</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="block w-full rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{t.subject}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{t.ticketNumber} · {formatDate(t.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="max-w-lg">
          {liveSelected && (
            <>
              <SheetHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle>{liveSelected.subject}</SheetTitle>
                  <StatusBadge status={liveSelected.status} />
                  <TicketPriorityBadge priority={liveSelected.priority} />
                </div>
              </SheetHeader>
              <p className="text-sm text-muted-foreground">{liveSelected.description}</p>

              <div className="border-t border-border pt-4">
                <p className="mb-3 text-sm font-semibold">Conversation</p>
                <div className="space-y-3">
                  {liveSelected.ticketReplies.length === 0 && (
                    <p className="text-xs text-muted-foreground">No replies yet — our team will respond shortly.</p>
                  )}
                  {liveSelected.ticketReplies.map((r) => (
                    <div key={r.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{r.user?.fullName ?? "Support Team"}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{r.message}</p>
                    </div>
                  ))}
                </div>

                {liveSelected.status !== "closed" && (
                  <div className="mt-4 flex gap-2">
                    <Input
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Write a reply..."
                      onKeyDown={(e) => e.key === "Enter" && handleReply()}
                    />
                    <Button size="icon" onClick={handleReply} disabled={isReplying || !replyMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

