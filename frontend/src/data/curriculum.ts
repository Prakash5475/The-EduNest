export interface CurriculumProgram {
  id: string;
  name: string;
  ageGroup: string;
  image: string;
  tagline: string;
  description: string;
  highlights: string[];
}

export const curriculumPrograms: CurriculumProgram[] = [
  {
    id: "CUR-1",
    name: "Little Explorers",
    ageGroup: "1.5 – 3 years",
    image: "https://picsum.photos/seed/curriculum-explorers/700/500",
    tagline: "Sensory-first learning for toddlers",
    description:
      "A play-based framework built around sensory exploration, motor skills, and early language development for our youngest learners.",
    highlights: ["Sensory play kits", "Story-based learning", "Motor skill activities", "Parent involvement guide"],
  },
  {
    id: "CUR-2",
    name: "Bright Beginnings",
    ageGroup: "3 – 4 years",
    image: "https://picsum.photos/seed/curriculum-beginnings/700/500",
    tagline: "Foundational literacy & numeracy",
    description:
      "Structured yet playful modules introducing letters, numbers, shapes, and social-emotional skills through themed units.",
    highlights: ["Phonics foundation", "Number sense activities", "Social-emotional learning", "Themed monthly units"],
  },
  {
    id: "CUR-3",
    name: "Future Ready",
    ageGroup: "4 – 6 years",
    image: "https://picsum.photos/seed/curriculum-future-ready/700/500",
    tagline: "School-readiness & critical thinking",
    description:
      "An NCF-aligned program preparing children for primary school with reading fluency, early math, and problem-solving projects.",
    highlights: ["NCF & NCP aligned", "Reading fluency track", "STEM project kits", "School transition support"],
  },
];

export interface CurriculumAddOn {
  id: string;
  title: string;
  description: string;
}

export const curriculumAddOns: CurriculumAddOn[] = [
  { id: "ADD-1", title: "Teacher Training", description: "Certified training workshops for your teaching staff on delivering the curriculum effectively." },
  { id: "ADD-2", title: "Assessment Toolkits", description: "Developmentally appropriate assessment sheets to track each child's growth through the year." },
  { id: "ADD-3", title: "Digital Companion App", description: "Parent-facing app access with daily activity updates and progress reports." },
];
