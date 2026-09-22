export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  featured?: boolean;
  features: string[];
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For small preschools just getting started with EduNest.",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Access to full product catalog",
      "Standard delivery timelines",
      "Email support",
      "Up to 2 active quotations",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing schools that order regularly through the year.",
    priceMonthly: 1999,
    priceYearly: 19990,
    featured: true,
    features: [
      "Everything in Starter",
      "Priority dealer quotations",
      "Dedicated account manager",
      "Bulk order discounts up to 8%",
      "Unlimited active quotations",
      "Rewards points ×1.5",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For school groups and large campuses with complex procurement.",
    priceMonthly: 4999,
    priceYearly: 49990,
    features: [
      "Everything in Growth",
      "Multi-campus consolidated billing",
      "Custom curriculum & branding packages",
      "Same-day quotation turnaround",
      "Rewards points ×2",
      "Quarterly business reviews",
    ],
  },
];
