export interface BrandingService {
  id: string;
  title: string;
  icon: "signage" | "uniform" | "print" | "interior" | "digital" | "merch";
  description: string;
}

export const brandingServices: BrandingService[] = [
  {
    id: "BR-1",
    title: "Classroom Signage & Wayfinding",
    icon: "signage",
    description: "Custom-designed signage, wall art, and wayfinding systems that bring your school's identity to every corridor.",
  },
  {
    id: "BR-2",
    title: "Uniform Branding",
    icon: "uniform",
    description: "Embroidered logos, custom colorways, and consistent branding across your school's uniform range.",
  },
  {
    id: "BR-3",
    title: "Print & Stationery",
    icon: "print",
    description: "Branded notebooks, report cards, certificates, and admission kits designed and printed to your specification.",
  },
  {
    id: "BR-4",
    title: "Classroom Interiors",
    icon: "interior",
    description: "Themed classroom decor, learning corners, and play areas designed around your school's visual identity.",
  },
  {
    id: "BR-5",
    title: "Digital Presence",
    icon: "digital",
    description: "Website refresh, social media templates, and digital signage content aligned with your brand guidelines.",
  },
  {
    id: "BR-6",
    title: "Promotional Merchandise",
    icon: "merch",
    description: "Branded water bottles, bags, and giveaways for admissions events, sports days, and annual functions.",
  },
];

export interface BrandingPortfolioItem {
  id: string;
  school: string;
  image: string;
  category: string;
}

export const brandingPortfolio: BrandingPortfolioItem[] = [
  { id: "PF-1", school: "Greenfield Academy", image: "https://picsum.photos/seed/branding-greenfield/600/450", category: "Signage" },
  { id: "PF-2", school: "Sunrise Public School", image: "https://picsum.photos/seed/branding-sunrise/600/450", category: "Uniforms" },
  { id: "PF-3", school: "Horizon International", image: "https://picsum.photos/seed/branding-horizon/600/450", category: "Classroom Interiors" },
  { id: "PF-4", school: "Cambridge School", image: "https://picsum.photos/seed/branding-cambridge/600/450", category: "Print & Stationery" },
];
