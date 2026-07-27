import { toast } from "sonner";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { currentSchool } from "@/utils/lookups";
import { initials } from "@/lib/utils";

export default function Profile() {
  return (
    <div>
      <PageHeader title="School Profile" description="Manage your school's information and account details." />

      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentSchool.image} alt={currentSchool.name} />
              <AvatarFallback>{initials(currentSchool.name)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" /> Change Logo
            </Button>
          </div>

          <div className="flex-1">
            <div className="mb-4 flex items-center gap-2">
              <p className="font-display text-xl font-semibold">{currentSchool.name}</p>
              <StatusBadge status={currentSchool.status} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="School Name" defaultValue={currentSchool.name} />
              <Field label="Principal Name" defaultValue={currentSchool.principalName} />
              <Field label="Email Address" defaultValue={currentSchool.email} type="email" />
              <Field label="Phone Number" defaultValue={currentSchool.phone} />
              <Field label="Board Affiliation" defaultValue={currentSchool.board} />
              <Field label="Affiliation Number" defaultValue={currentSchool.affiliationNo} />
              <Field label="Total Students" defaultValue={String(currentSchool.totalStudents)} />
              <Field label="Total Teachers" defaultValue={String(currentSchool.totalTeachers)} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => toast.success("Profile updated successfully")}>Save Changes</Button>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <p className="mb-4 text-sm font-semibold">Address</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Address Line" defaultValue={currentSchool.address.line1} />
          <Field label="City" defaultValue={currentSchool.address.city} />
          <Field label="State" defaultValue={currentSchool.address.state} />
          <Field label="Pincode" defaultValue={currentSchool.address.pincode} />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} type={type} />
    </div>
  );
}
