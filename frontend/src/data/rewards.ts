export interface RewardActivity {
  id: string;
  label: string;
  date: string;
  points: number;
}

export const rewardsSummary = {
  currentPoints: 4280,
  tier: "Gold Partner",
  nextTier: "Platinum Partner",
  pointsToNextTier: 1720,
  lifetimePoints: 18650,
};

export const rewardActivity: RewardActivity[] = [
  { id: "RWD-1", label: "Order ORD-2024-00156 delivered", date: "2024-05-25", points: 452 },
  { id: "RWD-2", label: "Order ORD-2024-00152 delivered", date: "2024-05-22", points: 345 },
  { id: "RWD-3", label: "Referral bonus — Cambridge School joined", date: "2024-05-18", points: 500 },
  { id: "RWD-4", label: "Order ORD-2024-00149 delivered", date: "2024-05-18", points: 526 },
  { id: "RWD-5", label: "Feedback survey completed", date: "2024-05-10", points: 100 },
];

export interface RewardPerk {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
}

export const rewardPerks: RewardPerk[] = [
  { id: "PRK-1", title: "5% Off Next Order", description: "Redeem for a 5% discount on your next bulk order.", pointsCost: 1000 },
  { id: "PRK-2", title: "Free Express Delivery", description: "Priority dispatch on your next 3 orders.", pointsCost: 750 },
  { id: "PRK-3", title: "Free Branding Consultation", description: "1-hour session with our branding solutions team.", pointsCost: 2000 },
  { id: "PRK-4", title: "Complimentary Teacher Training Kit", description: "One curriculum training kit for your staff.", pointsCost: 3500 },
];
