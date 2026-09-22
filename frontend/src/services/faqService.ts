import { apiClient } from "./apiClient";

export interface ApiFaq {
  id: string;
  category: string | null;
  question: string;
  answer: string;
}

export async function listFaqs(): Promise<ApiFaq[]> {
  const data = await apiClient.get<{ faqs: ApiFaq[] }>("/faqs", { anonymous: true });
  return data.faqs;
}
