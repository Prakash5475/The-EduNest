import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Store,
  Package,
  FileText,
  ShoppingCart,
  Wallet,
  Receipt,
  LineChart,
  ClipboardList,
  LifeBuoy,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";
import logomark from "@/assets/logomark.png";

const NAV_ITEMS = [
  { label: "Dashboard", to: paths.admin.dashboard, icon: LayoutDashboard, end: true },
  { label: "Schools", to: paths.admin.schools, icon: Building2 },
  { label: "Dealers", to: paths.admin.dealers, icon: Store },
  { label: "Products", to: paths.admin.products, icon: Package },
  { label: "Quotations", to: paths.admin.quotations, icon: FileText },
  { label: "Orders", to: paths.admin.orders, icon: ShoppingCart },
  { label: "Payments", to: paths.admin.payments, icon: Wallet },
  { label: "Invoices", to: paths.admin.invoices, icon: Receipt },
  { label: "Analytics", to: paths.admin.analytics, icon: LineChart },
  { label: "Reports", to: paths.admin.reports, icon: ClipboardList },
  { label: "Support", to: paths.admin.support, icon: LifeBuoy },
  { label: "Settings", to: paths.admin.settings, icon: SettingsIcon },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <img src={logomark} alt="" className="h-8 w-8" />
            <div className="leading-tight">
              <p className="font-display text-[15px] font-semibold text-edu-gray">The EduNest</p>
              <p className="text-[11px] text-muted-foreground">Admin Console</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 scrollbar-thin" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
