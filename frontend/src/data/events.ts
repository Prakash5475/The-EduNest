export interface EduEvent {
  id: string;
  title: string;
  type: "Webinar" | "Workshop" | "Expo" | "Training";
  date: string;
  time: string;
  mode: "Online" | "In-person";
  location?: string;
  image: string;
  description: string;
  registered: boolean;
}

export const events: EduEvent[] = [
  {
    id: "EVT-1",
    title: "Preschool Curriculum Trends 2024",
    type: "Webinar",
    date: "2024-06-05",
    time: "4:00 PM IST",
    mode: "Online",
    image: "https://picsum.photos/seed/event-curriculum/600/400",
    description: "A live session covering the latest play-based and Montessori-aligned curriculum trends.",
    registered: true,
  },
  {
    id: "EVT-2",
    title: "Classroom Branding & Signage Workshop",
    type: "Workshop",
    date: "2024-06-12",
    time: "11:00 AM IST",
    mode: "In-person",
    location: "Pune, Maharashtra",
    image: "https://picsum.photos/seed/event-branding/600/400",
    description: "Hands-on session on designing classroom branding, signage, and wayfinding for young learners.",
    registered: false,
  },
  {
    id: "EVT-3",
    title: "The EduNest Annual Partner Expo",
    type: "Expo",
    date: "2024-07-02",
    time: "10:00 AM IST",
    mode: "In-person",
    location: "Mumbai, Maharashtra",
    image: "https://picsum.photos/seed/event-expo/600/400",
    description: "Meet our dealer network, preview new product lines, and network with 200+ partner schools.",
    registered: false,
  },
  {
    id: "EVT-4",
    title: "Teacher Training: Early Literacy Techniques",
    type: "Training",
    date: "2024-06-20",
    time: "3:00 PM IST",
    mode: "Online",
    image: "https://picsum.photos/seed/event-literacy/600/400",
    description: "A certified training session for teaching staff on phonics and early literacy techniques.",
    registered: true,
  },
];
