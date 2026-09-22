import { useState, type ReactNode, type ComponentType } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Mail, Phone, MapPin, MoreVertical, RotateCcw, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAdminSchools, createAdminSchool, type CreateAdminSchoolInput } from "@/services/adminSchoolService";
import type { School } from "@/types";

type FilterTab = "All Schools" | "Active" | "Inactive";

export default function Schools() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FilterTab>("All Schools");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<School | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form state for creating a school
  const [formData, setFormData] = useState<CreateAdminSchoolInput>({
    fullName: "",
    email: "",
    phone: "",
    schoolName: "",
    schoolType: "k12",
    boardAffiliation: "CBSE",
    registrationNumber: "",
    gstin: "",
    status: "active",
  });

  const statusParam = tab === "Active" ? "active" : tab === "Inactive" ? "inactive" : undefined;
  const schoolTypeParam = selectedTypes.length
    ? selectedTypes.map((type) => type.replace(" ", "_")).join(",")
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-schools", statusParam, schoolTypeParam, page],
    queryFn: () => listAdminSchools({ status: statusParam, schoolType: schoolTypeParam, page }),
  });

  const rawItems = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  // Filter items locally by school type if selected
  const filtered = selectedTypes.length > 0
    ? rawItems.filter((s) => selectedTypes.includes(s.type.toLowerCase()) || selectedTypes.includes(s.type))
    : rawItems;

  const createMutation = useMutation({
    mutationFn: createAdminSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schools"] });
      toast.success("School created successfully");
      setAddModalOpen(false);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        schoolName: "",
        schoolType: "k12",
        boardAffiliation: "CBSE",
        registrationNumber: "",
        gstin: "",
        status: "active",
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create school");
    },
  });

  const handleResetFilters = () => {
    setTab("All Schools");
    setSelectedTypes([]);
    setPage(1);
  };

  const toggleType = (t: string) => {
    const type = t.toLowerCase().replace(" ", "_");
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  return (
    <div>
      <PageHeader
        title="Schools"
        description="Manage and view all registered schools."
        actions={
          <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add School
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Filter Schools</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          </div>
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
            {["K12", "Preschool", "Montessori", "Play School"].map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2.5">
                <Checkbox
                  checked={selectedTypes.includes(t.toLowerCase().replace(" ", "_"))}
                  onCheckedChange={() => toggleType(t)}
                />
                {t}
              </label>
            ))}
          </div>
        </Card>

        <div>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as FilterTab); setPage(1); }}>
            <TabsList className="mb-5">
              {(["All Schools", "Active", "Inactive"] as FilterTab[]).map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="flex h-48 flex-col items-center justify-center p-6 text-center">
              <p className="text-sm font-medium">No schools found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your status or category filters.</p>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={handleResetFilters}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((school) => (
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
          )}

          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      {/* Add School Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>School Name *</Label>
              <Input
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="e.g. St. Xavier School"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Person *</Label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Principal / Admin"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@school.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
                <p className="text-xs text-muted-foreground">Used as the school's initial login password.</p>
              </div>
              <div className="space-y-1.5">
                <Label>School Type</Label>
                <Select
                  value={formData.schoolType}
                  onValueChange={(val) => setFormData({ ...formData, schoolType: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="k12">K12</SelectItem>
                    <SelectItem value="preschool">Preschool</SelectItem>
                    <SelectItem value="montessori">Montessori</SelectItem>
                    <SelectItem value="play_school">Play School</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Board Affiliation</Label>
                <Input
                  value={formData.boardAffiliation}
                  onChange={(e) => setFormData({ ...formData, boardAffiliation: e.target.value })}
                  placeholder="e.g. CBSE / ICSE"
                />
              </div>
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="GST Number"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create School
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
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
                <InfoRow label="Principal Name" value={selected.principalName ?? "N/A"} />
                <InfoRow label="Established Year" value={String(selected.establishedYear ?? "-")} />
                <InfoRow label="School Type" value={selected.type} />
                <InfoRow label="Total Students" value={String(selected.totalStudents ?? "-")} />
                <InfoRow label="Total Teachers" value={String(selected.totalTeachers ?? "-")} />
                <InfoRow label="Affiliation No." value={selected.affiliationNo ?? "-"} />
              </Section>
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
