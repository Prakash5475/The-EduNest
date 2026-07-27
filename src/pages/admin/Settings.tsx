import { useState } from "react";
import {
  User,
  Building2,
  Users,
  ShieldCheck,
  Bell,
  CreditCard,
  Receipt,
  SlidersHorizontal,
  Lock,
  History,
  ChevronRight,
  Camera,
  KeyRound,
  Code,
  DownloadCloud,
  Activity,
  LifeBuoy,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SETTINGS_MENU = [
  { label: "Profile Settings", icon: User },
  { label: "Company Information", icon: Building2 },
  { label: "User Management", icon: Users },
  { label: "Roles & Permissions", icon: ShieldCheck },
  { label: "Notification Settings", icon: Bell },
  { label: "Payment Settings", icon: CreditCard },
  { label: "Invoice Settings", icon: Receipt },
  { label: "System Preferences", icon: SlidersHorizontal },
  { label: "Security Settings", icon: Lock },
  { label: "Backup & Restore", icon: History },
  { label: "Activity Logs", icon: Activity },
];

const QUICK_LINKS = [
  { title: "Company Information", description: "Update your company details, address and contact information.", icon: Building2 },
  { title: "User Management", description: "Add, edit or remove users and manage their access.", icon: Users },
  { title: "Roles & Permissions", description: "Manage user roles and set custom permissions.", icon: ShieldCheck },
  { title: "Notification Settings", description: "Configure email, SMS and in-app notification preferences.", icon: Bell },
  { title: "Payment Settings", description: "Manage payment methods, bank details and transaction preferences.", icon: CreditCard },
  { title: "Security Settings", description: "Update your password and manage two-factor authentication.", icon: Lock },
];

export default function Settings() {
  const [active, setActive] = useState("Profile Settings");

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account, preferences and system configurations." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <Card className="p-3">
            <p className="mb-2 px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Settings Menu
            </p>
            <nav className="space-y-1">
              {SETTINGS_MENU.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActive(label)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active === label ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </button>
              ))}
            </nav>
          </Card>

          <Card className="bg-primary/5 p-5">
            <p className="text-sm font-semibold">Customize Your Experience</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Update your preferences and manage your account settings to make EduNest work best for you.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Go to Preferences
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="mb-1 font-display text-lg font-semibold">{active}</p>
            <p className="mb-6 text-sm text-muted-foreground">Update your personal information and profile details.</p>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg">AU</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> Change Photo
                </Button>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" defaultValue="Admin User" />
                <Field label="Email Address" defaultValue="admin@edunest.com" type="email" />
                <Field label="Phone Number" defaultValue="+91 98765 43210" />
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Select defaultValue="super-admin">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super-admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Notification Settings</p>
            </div>
            <div className="mt-4 space-y-4">
              <ToggleRow label="Email Notifications" defaultChecked />
              <ToggleRow label="SMS Notifications" defaultChecked />
              <ToggleRow label="In-app Notifications" defaultChecked />
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-sm font-semibold">Quick Actions</p>
            <p className="mb-4 text-xs text-muted-foreground">Perform essential actions quickly</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction label="Change Password" icon={KeyRound} />
              <QuickAction label="Manage API Keys" icon={Code} />
              <QuickAction label="Download Backup" icon={DownloadCloud} />
              <QuickAction label="System Health" icon={Activity} />
            </div>
          </Card>

          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            <LifeBuoy className="h-5 w-5 shrink-0 text-primary" />
            Need help? Our support team is here to help you with any settings or configuration questions.
            <Button variant="link" size="sm" className="ml-auto shrink-0">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
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

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function QuickAction({ label, icon: Icon }: { label: string; icon: typeof KeyRound }) {
  return (
    <button className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:bg-muted">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
