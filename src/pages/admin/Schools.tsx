import { useMemo, useState, type ReactNode, type ComponentType } from "react";
import { Plus, Mail, Phone, MapPin, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/usePagination";
import { schools } from "@/data/schools";
import type { School } from "@/types";

type FilterTab = "All Schools" | "Active" | "Inactive";

export default function Schools() {
  const [tab, setTab] = useState<FilterTab>("All Schools");
  const [selected, setSelected] = useState<School | null>(null);

  const filtered = useMemo(() => {
    if (tab === "Active") return schools.filter((s) => s.status === "active");
    if (tab === "Inactive") return schools.filter((s) => s.status === "inactive");
    return schools;
  }, [tab]);

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 6);

  return (
    <div>
      <PageHeader
        title="Schools"
        description="Manage and view all registered schools."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add School
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-5">
          <p className="mb-3 text-sm font-semibold">Filter Schools</p>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          <div className="space-y-2 text-sm">
            {(["All Schools", "Active", "Inactive"] as FilterTab[]).map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2.5 text-muted-foreground">
                <Checkbox checked={tab === opt} onCheckedChange={() => setTab(opt)} />
                {opt}
              </label>
            ))}
          </div>

          <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            School Type
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            {["Public", "Private", "International"].map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2.5">
                <Checkbox />
                {t}
              </label>
            ))}
          </div>
        </Card>

        <div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
            <TabsList className="mb-5">
              {(["All Schools", "Active", "Inactive"] as FilterTab[]).map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((school) => (
              <Card key={school.id} className="overflow-hidden">
                <img src={school.image} alt="" className="h-36 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{school.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {school.city}, {school.state}
                      </p>
                    </div>
                    <StatusBadge status={school.status} />
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {school.email}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {school.phone}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-secondary">{school.board}</span>
                    <button
                      onClick={() => setSelected(school)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label={`View ${school.name} details`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <img src={selected.image} alt="" className="mb-4 h-40 w-full rounded-2xl object-cover" />
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{selected.name}</SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {selected.board} · {selected.type}
                </p>
              </SheetHeader>

              <Section title="Contact Information">
                <DetailRow icon={Mail} value={selected.email} />
                <DetailRow icon={Phone} value={selected.phone} />
                <DetailRow icon={MapPin} value={`${selected.address.line1}, ${selected.city}, ${selected.state} - ${selected.address.pincode}`} />
              </Section>

              <Section title="School Information">
                <InfoRow label="Principal Name" value={selected.principalName} />
                <InfoRow label="Established Year" value={String(selected.establishedYear)} />
                <InfoRow label="School Type" value={selected.type} />
                <InfoRow label="Total Students" value={String(selected.totalStudents)} />
                <InfoRow label="Total Teachers" value={String(selected.totalTeachers)} />
                <InfoRow label="Affiliation No." value={selected.affiliationNo} />
              </Section>

              <div className="mt-auto flex gap-3 border-t border-border pt-5">
                <Button className="flex-1">Edit School</Button>
                <Button variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5">
                  Delete School
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border py-4">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function DetailRow({ icon: Icon, value }: { icon: ComponentType<{ className?: string }>; value: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" /> {value}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
