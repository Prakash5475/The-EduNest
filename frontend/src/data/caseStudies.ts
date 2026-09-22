export interface CaseStudy {
  id: string;
  school: string;
  location: string;
  image: string;
  category: string;
  headline: string;
  summary: string;
  metric: { label: string; value: string };
}

export const caseStudies: CaseStudy[] = [
  {
    id: "CS-1",
    school: "Greenfield Academy",
    location: "Pune, Maharashtra",
    image: "https://picsum.photos/seed/success-greenfield/700/500",
    category: "Curriculum Rollout",
    headline: "Cutting curriculum planning time by half",
    summary:
      "Greenfield Academy adopted the Future Ready curriculum program and paired it with teacher training, streamlining lesson planning across 12 classrooms.",
    metric: { label: "Planning time saved", value: "50%" },
  },
  {
    id: "CS-2",
    school: "Sunrise Public School",
    location: "Mumbai, Maharashtra",
    image: "https://picsum.photos/seed/success-sunrise/700/500",
    category: "Branding & Interiors",
    headline: "A full campus rebrand in one summer break",
    summary:
      "Sunrise Public School worked with our branding team to redesign signage, uniforms, and classroom interiors ahead of their new academic year.",
    metric: { label: "Campus areas rebranded", value: "18" },
  },
  {
    id: "CS-3",
    school: "St. Mary's Convent",
    location: "Bangalore, Karnataka",
    image: "https://picsum.photos/seed/success-stmarys/700/500",
    category: "Procurement",
    headline: "Consolidating 6 vendors into one platform",
    summary:
      "St. Mary's Convent moved their entire annual supply procurement onto EduNest, replacing six separate vendor relationships with one dashboard.",
    metric: { label: "Procurement time saved", value: "30 hrs/term" },
  },
  {
    id: "CS-4",
    school: "Horizon International",
    location: "Pune, Maharashtra",
    image: "https://picsum.photos/seed/success-horizon/700/500",
    category: "Teacher Training",
    headline: "Onboarding 32 new teachers in record time",
    summary:
      "Horizon International used EduNest's teacher training and digital companion app to onboard an entirely new teaching staff before term start.",
    metric: { label: "Teachers trained", value: "32" },
  },
];

export const successMetrics = [
  { label: "Partner Schools", value: "500+" },
  { label: "Avg. Procurement Time Saved", value: "40%" },
  { label: "Curriculum Programs Delivered", value: "180+" },
  { label: "Teacher Training Sessions", value: "620+" },
];
