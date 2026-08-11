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
  FileBadge,
  Palette,
  Mail,
  Truck,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  defaultCompanySettings,
  defaultGstSettings,
  defaultBrandingSettings,
  defaultShippingSettings,
  defaultBusinessRuleSettings,
  settingsService,
} from "@/services/settingsService";

const SETTINGS_MENU = [
  { label: "Profile Settings", icon: User },
  { label: "Company Information", icon: Building2 },
  { label: "GST Settings", icon: FileBadge },
  { label: "Branding", icon: Palette },
  { label: "User Management", icon: Users },
  { label: "Roles & Permissions", icon: ShieldCheck },
  { label: "Notification Settings", icon: Bell },
  { label: "Email Settings", icon: Mail },
  { label: "Payment Settings", icon: CreditCard },
  { label: "Invoice Settings", icon: Receipt },
  { label: "Shipping Settings", icon: Truck },
  { label: "Business Rules", icon: ListChecks },
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

const SETTINGS_DESCRIPTIONS: Record<string, string> = {
  "Profile Settings": "Update your personal information and profile details.",
  "Company Information": "These details appear on quotations, invoices and customer-facing documents.",
  "GST Settings": "Tax registration details used to calculate GST on quotations and invoices.",
  "Branding": "Colors used across the storefront and generated documents. Changing these updates the live theme once saved.",
  "User Management": "Add, edit or remove admin users and manage their access to the console.",
  "Roles & Permissions": "Define what each role can view, create, or approve across the platform.",
  "Notification Settings": "Choose how you're notified about orders, payments and quotations.",
  "Email Settings": "Configure the outgoing mailbox used for quotations, invoices and alerts.",
  "Payment Settings": "Manage accepted payment methods, bank details and gateway configuration.",
  "Invoice Settings": "Control invoice numbering, due dates and default terms.",
  "Shipping Settings": "Default carrier, delivery windows and free-shipping thresholds.",
  "Business Rules": "Platform-wide rules like minimum order quantity and dealer auto-assignment.",
  "System Preferences": "General preferences for how the console behaves.",
  "Security Settings": "Manage your password and two-factor authentication.",
  "Backup & Restore": "Download a backup of your data or restore from a previous export.",
  "Activity Logs": "A record of recent account and configuration changes.",
};

export default function Settings() {
  const [active, setActive] = useState("Profile Settings");

  const [company, setCompany] = useState(defaultCompanySettings);
  const [gst, setGst] = useState(defaultGstSettings);
  const [branding, setBranding] = useState(defaultBrandingSettings);
  const [shipping, setShipping] = useState(defaultShippingSettings);
  const [businessRules, setBusinessRules] = useState(defaultBusinessRuleSettings);

  async function handleSave(section: string, fn: () => Promise<{ success: boolean }>) {
    try {
      await fn();
      toast.success(`${section} saved`);
    } catch {
      toast.error(`Couldn't save ${section.toLowerCase()}`);
    }
  }

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
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setActive("System Preferences")}>
              Go to Preferences
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="mb-1 font-display text-lg font-semibold">{active}</p>
            <p className="mb-6 text-sm text-muted-foreground">{SETTINGS_DESCRIPTIONS[active]}</p>

            {active === "Profile Settings" && (
              <>
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
                  <Button onClick={() => toast.success("Profile saved")}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "Company Information" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Company Name" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
                  <Field label="Email Address" value={company.email} type="email" onChange={(v) => setCompany({ ...company, email: v })} />
                  <Field label="Phone Number" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
                  <Field label="Website" value={company.website} onChange={(v) => setCompany({ ...company, website: v })} />
                  <Field label="Address Line" value={company.address.line1} onChange={(v) => setCompany({ ...company, address: { ...company.address, line1: v } })} />
                  <Field label="City" value={company.address.city} onChange={(v) => setCompany({ ...company, address: { ...company.address, city: v } })} />
                  <Field label="State" value={company.address.state} onChange={(v) => setCompany({ ...company, address: { ...company.address, state: v } })} />
                  <Field label="Pincode" value={company.address.pincode} onChange={(v) => setCompany({ ...company, address: { ...company.address, pincode: v } })} />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleSave("Company information", () => settingsService.saveCompany(company))}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "GST Settings" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="GST Number" value={gst.gstNumber} onChange={(v) => setGst({ ...gst, gstNumber: v })} />
                  <Field label="PAN Number" value={gst.panNumber} onChange={(v) => setGst({ ...gst, panNumber: v })} />
                  <Field label="Tax Registration State" value={gst.taxRegistrationState} onChange={(v) => setGst({ ...gst, taxRegistrationState: v })} />
                  <div className="space-y-1.5">
                    <Label>Default GST %</Label>
                    <Input type="number" value={gst.defaultGstPct} onChange={(e) => setGst({ ...gst, defaultGstPct: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleSave("GST settings", () => settingsService.saveGst(gst))}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "Branding" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ColorField label="Primary Color" value={branding.primaryColor} onChange={(v) => setBranding({ ...branding, primaryColor: v })} />
                  <ColorField label="Secondary Color" value={branding.secondaryColor} onChange={(v) => setBranding({ ...branding, secondaryColor: v })} />
                  <ColorField label="Accent Color" value={branding.accentColor} onChange={(v) => setBranding({ ...branding, accentColor: v })} />
                </div>
                <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  These colors drive the theme across the storefront, admin console and generated documents. Preview and rollout tooling is prepared for when the branding API is connected.
                </p>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleSave("Branding", () => settingsService.saveBranding(branding))}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "Notification Settings" && (
              <div className="space-y-4">
                <ToggleRow label="Email Notifications" defaultChecked />
                <ToggleRow label="SMS Notifications" defaultChecked />
                <ToggleRow label="In-app Notifications" defaultChecked />
                <ToggleRow label="Order Status Updates" defaultChecked />
                <ToggleRow label="Quotation Updates" defaultChecked />
                <ToggleRow label="Dealer Assignment Alerts" />
                <div className="flex justify-end pt-2">
                  <Button onClick={() => toast.success("Notification preferences saved")}>Save Changes</Button>
                </div>
              </div>
            )}

            {active === "Email Settings" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="From Name" defaultValue="The EduNest" />
                  <Field label="From Email" defaultValue="no-reply@theedunest.com" type="email" />
                  <Field label="SMTP Host" placeholder="smtp.provider.com" />
                  <Field label="SMTP Port" placeholder="587" />
                </div>
                <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  Connect your transactional email provider to send quotations, invoices and order alerts automatically.
                </p>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => toast.success("Email settings saved")}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "Payment Settings" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Bank Account Name" placeholder="The EduNest Pvt. Ltd." />
                  <Field label="Bank Account Number" placeholder="XXXXXXXXXXXX" />
                  <Field label="IFSC Code" placeholder="HDFC0001234" />
                  <Field label="UPI ID" placeholder="edunest@upi" />
                </div>
                <div className="mt-4 space-y-3">
                  <ToggleRow label="Accept Bank Transfer" defaultChecked />
                  <ToggleRow label="Accept UPI" defaultChecked />
                  <ToggleRow label="Accept Cheque" defaultChecked />
                  <ToggleRow label="Accept Razorpay (Cards / Netbanking)" />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => toast.success("Payment settings saved")}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "Invoice Settings" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Invoice Prefix" defaultValue="INV-2024-" />
                  <Field label="Starting Number" defaultValue="0127" />
                  <Field label="Default Due (days)" defaultValue="10" />
                  <Field label="Default Terms" defaultValue="Payment due within 10 days" />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => toast.success("Invoice settings saved")}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "Shipping Settings" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Default Carrier" value={shipping.defaultCarrier} onChange={(v) => setShipping({ ...shipping, defaultCarrier: v })} />
                  <div className="space-y-1.5">
                    <Label>Free Shipping Threshold (₹)</Label>
                    <Input type="number" value={shipping.freeShippingThreshold} onChange={(e) => setShipping({ ...shipping, freeShippingThreshold: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Standard Delivery (days)</Label>
                    <Input type="number" value={shipping.standardDeliveryDays} onChange={(e) => setShipping({ ...shipping, standardDeliveryDays: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Express Delivery (days)</Label>
                    <Input type="number" value={shipping.expressDeliveryDays} onChange={(e) => setShipping({ ...shipping, expressDeliveryDays: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleSave("Shipping settings", () => settingsService.saveShipping(shipping))}>Save Changes</Button>
                </div>
              </>
            )}

            {active === "Business Rules" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Minimum Order Quantity</Label>
                    <Input type="number" value={businessRules.minOrderQty} onChange={(e) => setBusinessRules({ ...businessRules, minOrderQty: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quotation Validity (days)</Label>
                    <Input type="number" value={businessRules.quotationValidityDays} onChange={(e) => setBusinessRules({ ...businessRules, quotationValidityDays: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dealer Overload Threshold (%)</Label>
                    <Input type="number" value={businessRules.overloadThresholdPct} onChange={(e) => setBusinessRules({ ...businessRules, overloadThresholdPct: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="mt-4">
                  <ToggleRow
                    label="Auto-assign dealers based on capacity"
                    defaultChecked={businessRules.autoAssignDealers}
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleSave("Business rules", () => settingsService.saveBusinessRules(businessRules))}>Save Changes</Button>
                </div>
              </>
            )}

            {["User Management", "Roles & Permissions", "System Preferences", "Security Settings", "Backup & Restore", "Activity Logs"].includes(active) && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
                <p className="text-sm text-muted-foreground max-w-sm">
                  {active} will connect to the admin API once the backend is ready. The UI shell is in place and wired for that data.
                </p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map(({ title, description, icon: Icon }) => (
              <button key={title} onClick={() => setActive(title)} className="text-left">
                <Card className="p-5 transition-shadow hover:shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </Card>
              </button>
            ))}
          </div>

          <Card className="p-5">
            <p className="mb-4 text-sm font-semibold">Quick Actions</p>
            <p className="mb-4 text-xs text-muted-foreground">Perform essential actions quickly</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction label="Change Password" icon={KeyRound} onClick={() => setActive("Security Settings")} />
              <QuickAction label="Manage API Keys" icon={Code} onClick={() => setActive("System Preferences")} />
              <QuickAction label="Download Backup" icon={DownloadCloud} onClick={() => setActive("Backup & Restore")} />
              <QuickAction label="System Health" icon={Activity} onClick={() => setActive("Activity Logs")} />
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

function Field({
  label,
  defaultValue,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  type?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {onChange ? (
        <Input value={value} placeholder={placeholder} type={type} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input defaultValue={defaultValue} placeholder={placeholder} type={type} />
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
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

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: typeof KeyRound; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:bg-muted"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
