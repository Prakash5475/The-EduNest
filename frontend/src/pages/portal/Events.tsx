import { useState } from "react";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { events as initialEvents } from "@/data/events";
import { formatDate } from "@/lib/utils";

export default function Events() {
  const [events, setEvents] = useState(initialEvents);

  function toggleRegister(id: string, title: string) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next = !e.registered;
        toast.success(next ? `Registered for ${title}` : `Registration cancelled for ${title}`);
        return { ...e, registered: next };
      })
    );
  }

  return (
    <div>
      <PageHeader title="Events" description="Webinars, workshops, and training sessions for your school." />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {events.map((e) => (
          <Card key={e.id} className="overflow-hidden">
            <div className="relative h-44 overflow-hidden">
              <img src={e.image} alt={e.title} className="h-full w-full object-cover" />
              <Badge className="absolute left-3 top-3">{e.type}</Badge>
              {e.registered && (
                <Badge variant="success" className="absolute right-3 top-3">
                  Registered
                </Badge>
              )}
            </div>
            <div className="p-5">
              <p className="font-display text-base font-semibold">{e.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{e.description}</p>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(e.date)}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {e.time}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {e.mode}{e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
              <Button
                variant={e.registered ? "outline" : "default"}
                size="sm"
                className="mt-4 w-full"
                onClick={() => toggleRegister(e.id, e.title)}
              >
                {e.registered ? "Cancel Registration" : "Register Now"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
