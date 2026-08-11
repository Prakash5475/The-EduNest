export interface KitItem {
  name: string;
  qty: string;
}

export interface PreschoolKit {
  id: string;
  name: string;
  ageGroup: string;
  image: string;
  price: number;
  originalPrice: number;
  tagline: string;
  items: KitItem[];
  badge?: string;
}

export const preschoolKits: PreschoolKit[] = [
  {
    id: "KIT-1",
    name: "Little Explorers Starter Kit",
    ageGroup: "1.5 – 3 years",
    image: "https://picsum.photos/seed/kit-explorers/700/500",
    price: 3499,
    originalPrice: 4200,
    tagline: "Everything a toddler classroom needs to begin the year",
    badge: "Best Seller",
    items: [
      { name: "Sensory play set", qty: "1 set" },
      { name: "Board books (set of 6)", qty: "6 pcs" },
      { name: "Soft building blocks", qty: "1 set" },
      { name: "Name tags & cubbies labels", qty: "20 pcs" },
    ],
  },
  {
    id: "KIT-2",
    name: "Bright Beginnings Classroom Kit",
    ageGroup: "3 – 4 years",
    image: "https://picsum.photos/seed/kit-beginnings/700/500",
    price: 5299,
    originalPrice: 6100,
    tagline: "Foundational literacy & numeracy essentials for a full classroom",
    items: [
      { name: "Alphabet & number flashcards", qty: "2 sets" },
      { name: "Classmate notebooks", qty: "30 pcs" },
      { name: "Crayon & color pencil packs", qty: "30 packs" },
      { name: "Story time book collection", qty: "12 pcs" },
      { name: "Classroom charts", qty: "8 pcs" },
    ],
  },
  {
    id: "KIT-3",
    name: "Future Ready School Prep Kit",
    ageGroup: "4 – 6 years",
    image: "https://picsum.photos/seed/kit-future-ready/700/500",
    price: 6899,
    originalPrice: 7900,
    tagline: "School-readiness bundle with STEM and assessment materials",
    badge: "New",
    items: [
      { name: "STEM activity kits", qty: "10 sets" },
      { name: "Writing practice worksheets", qty: "1 pack" },
      { name: "Geometry & math manipulatives", qty: "1 set" },
      { name: "Assessment toolkits", qty: "30 pcs" },
      { name: "Reading fluency book set", qty: "15 pcs" },
    ],
  },
];
