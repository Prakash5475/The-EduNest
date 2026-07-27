import type { RevenuePoint, CategorySales, MonthlyComparison } from "@/types";

export const revenueOverview: RevenuePoint[] = [
  { date: "20 May", revenue: 320000 },
  { date: "21 May", revenue: 410000 },
  { date: "22 May", revenue: 385000 },
  { date: "23 May", revenue: 568450 },
  { date: "24 May", revenue: 420000 },
  { date: "25 May", revenue: 390000 },
  { date: "26 May", revenue: 452000 },
];

export const categorySales: CategorySales[] = [
  { category: "Books & Notes", value: 34.2, color: "#F44336" },
  { category: "Stationery", value: 26.8, color: "#1976D2" },
  { category: "Bags & Luggage", value: 16.5, color: "#FFC107" },
  { category: "Art & Craft", value: 12.1, color: "#4CAF50" },
  { category: "Electronics", value: 6.2, color: "#9C27B0" },
  { category: "Others", value: 4.2, color: "#90A4AE" },
];

export const monthlySalesComparison: MonthlyComparison[] = [
  { day: "01", thisMonth: 210000, lastMonth: 180000 },
  { day: "05", thisMonth: 340000, lastMonth: 290000 },
  { day: "10", thisMonth: 520000, lastMonth: 410000 },
  { day: "15", thisMonth: 610000, lastMonth: 500000 },
  { day: "20", thisMonth: 480000, lastMonth: 460000 },
  { day: "25", thisMonth: 590000, lastMonth: 470000 },
  { day: "31", thisMonth: 700000, lastMonth: 620000 },
];

export const topPerformingSchools = [
  { school: "Greenfield Academy", orders: 12, revenue: 456780 },
  { school: "Sunrise Public School", orders: 9, revenue: 298540 },
  { school: "Delhi Public School", orders: 8, revenue: 245670 },
  { school: "St. Mary's Convent", orders: 6, revenue: 178350 },
  { school: "Oxford International", orders: 5, revenue: 134880 },
];

export const analyticsSummary = {
  totalRevenue: 2485680,
  totalOrders: 156,
  totalQuotations: 128,
  totalSchools: 254,
  totalDealers: 92,
  revenueChangePct: 18.6,
  ordersChangePct: 12.4,
  quotationsChangePct: 8.7,
  schoolsChangePct: 5.3,
  dealersChangePct: 7.1,
};
