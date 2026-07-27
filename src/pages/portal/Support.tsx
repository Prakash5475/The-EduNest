import { useState } from "react";
import { LifeBuoy, Mail, Phone, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { faqs, supportTickets } from "@/data/faqs";
import { formatDate } from "@/lib/utils";

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function submitTicket() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }
    toast.success("Support ticket submitted — we'll respond within 24 hours");
    setSubject("");
    setMessage("");
  }

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
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
              <Button className="w-full" onClick={submitTicket}>Submit Ticket</Button>
            </div>
          </Card>

          <Card className="p-6">
            <p className="mb-3 text-sm font-semibold">Your Tickets</p>
            <div className="space-y-3">
              {supportTickets.map((t) => (
                <div key={t.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{t.subject}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.id} · {formatDate(t.date)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
