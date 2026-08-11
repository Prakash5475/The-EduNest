import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, ShoppingCart, ArrowRight, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { paths } from "@/routes/paths";
import { useCart } from "@/context/CartContext";
import { useAuth, homeRouteFor } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import fullLogo from "@/assets/logo-full.png";

const NAV_LINKS = [
  { label: "Home", to: paths.home },
  { label: "About Us", to: paths.about },
];

const SOLUTIONS = [
  { label: "Shop", to: paths.shop },
  { label: "Categories", to: paths.categories },
  { label: "Complete Preschool Kits", to: paths.preschoolKits },
  { label: "Curriculum Solutions", to: paths.curriculumSolutions },
  { label: "Branding Solutions", to: paths.brandingSolutions },
  { label: "Dealer Marketplace", to: paths.dealerMarketplace },
  { label: "Preschool Success Hub", to: paths.successHub },
  { label: "Bulk Orders", to: paths.bulkOrders },
  { label: "Request Quotation", to: paths.requestQuotation },
];

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const accountHref = isAuthenticated && user ? homeRouteFor(user.userType) : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link to={paths.home} className="flex shrink-0 items-center">
          <img src={fullLogo} alt="The EduNest — Essentials for bright start!" className="h-11" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-foreground"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary focus:outline-none">
              Our Solutions <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {SOLUTIONS.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to={paths.portal.resources} className="text-sm font-medium text-foreground transition-colors hover:text-primary">
            Learning Resources
          </Link>
          <span className="text-sm font-medium text-muted-foreground">TheEduNest App</span>
          <Link to={paths.requestQuotation} className="text-sm font-medium text-foreground transition-colors hover:text-primary">
            Contact Us
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted focus:outline-none" aria-label="My Account">
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium text-foreground">{user.fullName}</div>
                <DropdownMenuItem asChild>
                  <Link to={accountHref}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void logout()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to={accountHref}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted"
              aria-label="Sign in"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <Link
            to={paths.cart}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted"
            aria-label={`Cart (${itemCount} items)`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
          <Button asChild className="gap-2">
            <Link to={paths.requestQuotation}>
              Partner With Us <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <button
          className="rounded-lg p-2 text-foreground lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {[...NAV_LINKS, ...SOLUTIONS].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={paths.cart}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cart ({itemCount})
            </Link>
            <Link
              to={accountHref}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              My Account
            </Link>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  void logout();
                }}
                className="rounded-lg px-2 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
              >
                Sign out
              </button>
            )}
            <Button asChild className="mt-2 w-full gap-2">
              <Link to={paths.requestQuotation} onClick={() => setMobileOpen(false)}>
                Partner With Us <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
