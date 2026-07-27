import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Gift,
  CreditCard,
  BookOpen,
  CalendarDays,
  LifeBuoy,
  Bell,
  Building2,
  X,
  Globe,
} from "lucide-react";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";
import logomark from "@/assets/logomark.png";

const NAV_ITEMS = [
  { label: "Dashboard", to: paths.portal.dashboard, icon: LayoutDashboard, end: true },
  { label: "My Orders", to: paths.portal.orders, icon: ShoppingBag },
  { label: "Wishlist", to: paths.portal.wishlist, icon: Heart },
  { label: "Rewards", to: paths.portal.rewards, icon: Gift },
  { label: "Subscription Plans", to: paths.portal.subscriptions, icon: CreditCard },
  { label: "Learning Resources", to: paths.portal.resources, icon: BookOpen },
  { label: "Events", to: paths.portal.events, icon: CalendarDays },
  { label: "Support Center", to: paths.portal.support, icon: LifeBuoy },
  { label: "Notifications", to: paths.portal.notifications, icon: Bell },
  { label: "School Profile", to: paths.portal.profile, icon: Building2 },
];

interface PortalSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function PortalSidebar({ mobileOpen, onCloseMobile }: PortalSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
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
              <p className="text-[11px] text-muted-foreground">School Portal</p>
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6 scrollbar-thin" aria-label="Portal navigation">
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

        <div className="border-t border-border p-3">
          <Link
            to={paths.home}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Globe className="h-[18px] w-[18px] shrink-0" /> Back to Website
          </Link>
        </div>
      </aside>
    </>
  );
}
