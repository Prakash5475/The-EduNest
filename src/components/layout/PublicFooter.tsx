import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { paths } from "@/routes/paths";
import wordmark from "@/assets/wordmark.png";

const FOOTER_COLUMNS = [
  {
    title: "Our Solutions",
    links: [
      { label: "Shop", to: paths.shop },
      { label: "Categories", to: paths.categories },
      { label: "Bulk Orders", to: paths.bulkOrders },
      { label: "Request Quotation", to: paths.requestQuotation },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: paths.about },
      { label: "Contact Us", to: paths.requestQuotation },
      { label: "Partner With Us", to: paths.requestQuotation },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-edu-gray text-white">
      <div className="container grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={wordmark} alt="The EduNest" className="h-9 brightness-0 invert" />
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Essentials for bright start! Simplifying preschool procurement and enriching learning
            experiences for 500+ partner schools.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Linkedin].map((Icon, idx) => (
              <span
                key={idx}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-primary"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-white">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-white/70 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-sm font-semibold text-white">Get in Touch</p>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Baner, Pune, Maharashtra 411045
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0" /> +91 98765 43210
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0" /> hello@theedunest.com
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-white/60">© 2024 The EduNest. All rights reserved.</p>
          <Link to={paths.admin.dashboard} className="text-xs text-white/50 hover:text-white/80">
            Admin Console Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
