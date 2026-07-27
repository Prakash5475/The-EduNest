import { schools } from "@/data/schools";
import { dealers } from "@/data/dealers";

/** The demo-logged-in school for the client portal (no auth backend in this build). */
export const currentSchool = schools[0];

export function getSchool(id: string) {
  return schools.find((s) => s.id === id);
}

export function getDealer(id: string) {
  return dealers.find((d) => d.id === id);
}

export function getSchoolName(id: string): string {
  return getSchool(id)?.name ?? "Unknown School";
}

export function getDealerName(id: string): string {
  return getDealer(id)?.name ?? "Unknown Dealer";
}
