export interface LearningResource {
  id: string;
  title: string;
  type: "Article" | "Guide" | "Video" | "Worksheet";
  category: string;
  image: string;
  readTime: string;
  summary: string;
}

export const learningResources: LearningResource[] = [
  {
    id: "RES-1",
    title: "Building a Play-Based Learning Curriculum",
    type: "Guide",
    category: "Curriculum",
    image: "https://picsum.photos/seed/resource-play-based/600/400",
    readTime: "8 min read",
    summary: "A practical framework for introducing play-based learning into your preschool's daily routine.",
  },
  {
    id: "RES-2",
    title: "Classroom Setup for Early Years",
    type: "Article",
    category: "Classroom Design",
    image: "https://picsum.photos/seed/resource-classroom/600/400",
    readTime: "5 min read",
    summary: "How to organize learning corners, reading nooks, and activity zones for 3–6 year olds.",
  },
  {
    id: "RES-3",
    title: "Teacher Training: Managing Group Activities",
    type: "Video",
    category: "Teacher Development",
    image: "https://picsum.photos/seed/resource-teacher-training/600/400",
    readTime: "12 min watch",
    summary: "A recorded training session on facilitating group activities for large preschool classes.",
  },
  {
    id: "RES-4",
    title: "Printable Alphabet Tracing Worksheets",
    type: "Worksheet",
    category: "Classroom Resources",
    image: "https://picsum.photos/seed/resource-worksheets/600/400",
    readTime: "Downloadable",
    summary: "A ready-to-print worksheet pack covering uppercase and lowercase letter tracing.",
  },
  {
    id: "RES-5",
    title: "NCF Alignment Checklist for Preschools",
    type: "Guide",
    category: "Compliance",
    image: "https://picsum.photos/seed/resource-ncf/600/400",
    readTime: "6 min read",
    summary: "A step-by-step checklist to make sure your curriculum aligns with NCF & NCP guidelines.",
  },
  {
    id: "RES-6",
    title: "Talking to Parents About School Supplies",
    type: "Article",
    category: "Parent Communication",
    image: "https://picsum.photos/seed/resource-parents/600/400",
    readTime: "4 min read",
    summary: "Templates and tips for communicating annual supply lists and costs to parents clearly.",
  },
];
