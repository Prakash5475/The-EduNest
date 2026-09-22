import { apiClient } from "./apiClient";

export interface ApiSchoolAccount {
  id: string;
  schoolName: string;
  schoolCode: string;
  schoolType: string;
  boardAffiliation: string | null;
  registrationNumber: string | null;
  gstin: string | null;
  status: string;
  logoFile?: { filePath: string } | null;
  schoolProfile: {
    websiteUrl: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    altPhone: string | null;
    about: string | null;
    studentCount: number | null;
    teacherCount: number | null;
    branchCount: number;
    establishedYear: string | null;
  } | null;
}

export interface SchoolAccountUpdateInput {
  schoolName?: string;
  boardAffiliation?: string;
  registrationNumber?: string;
  gstin?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  altPhone?: string;
  about?: string;
  studentCount?: number;
  teacherCount?: number;
}

export async function getMySchoolAccount(): Promise<ApiSchoolAccount> {
  const data = await apiClient.get<{ school: ApiSchoolAccount }>("/schools/me");
  return data.school;
}

export async function updateMySchoolAccount(input: SchoolAccountUpdateInput): Promise<ApiSchoolAccount> {
  const data = await apiClient.patch<{ school: ApiSchoolAccount }>("/schools/me", input);
  return data.school;
}
