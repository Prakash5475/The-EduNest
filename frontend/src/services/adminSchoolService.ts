import { apiClient } from "./apiClient";
import type { School } from "@/types";

export interface ApiAdminSchool {
  id: string;
  uuid: string;
  schoolName: string;
  schoolCode: string;
  schoolType: string;
  boardAffiliation: string | null;
  registrationNumber: string | null;
  gstin: string | null;
  status: "active" | "inactive" | "pending_approval" | "blocked";
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  schoolProfiles?: Array<{
    principalName?: string;
    establishedYear?: string;
    studentCount?: number;
    teacherCount?: number;
  }>;
  schoolAddresses?: Array<{
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  }>;
}

export function adaptAdminSchool(s: ApiAdminSchool): School {
  const profile = s.schoolProfiles?.[0];
  const address = s.schoolAddresses?.[0];
  return {
    id: s.id,
    name: s.schoolName,
    code: s.schoolCode,
    type: s.schoolType ?? "k12",
    board: s.boardAffiliation ?? "CBSE",
    email: s.user?.email ?? "N/A",
    phone: s.user?.phone ?? "N/A",
    city: address?.city ?? "New Delhi",
    state: address?.state ?? "Delhi",
    status: s.status === "active" ? "active" : "inactive",
    image: "/placeholder-school.jpg",
    principalName: s.user?.fullName ?? "Principal",
    establishedYear: Number(profile?.establishedYear ?? "2010"),
    totalStudents: profile?.studentCount ?? 500,
    totalTeachers: profile?.teacherCount ?? 35,
    affiliationNo: s.registrationNumber ?? s.schoolCode,
    address: {
      line1: address?.addressLine1 ?? "Main Road",
      city: address?.city ?? "New Delhi",
      state: address?.state ?? "Delhi",
      pincode: address?.pincode ?? "110001",
    },
  };
}

export async function listAdminSchools(filters?: { status?: string; schoolType?: string; search?: string; page?: number }) {
  const { data, meta } = await apiClient.withMeta<ApiAdminSchool[]>("/admin/schools", {
    query: filters as Record<string, string | number | undefined>,
  });
  return {
    items: (data ?? []).map(adaptAdminSchool),
    meta: meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export interface CreateAdminSchoolInput {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  schoolName: string;
  schoolCode?: string;
  schoolType?: string;
  boardAffiliation?: string;
  registrationNumber?: string;
  gstin?: string;
  status?: string;
}

export async function createAdminSchool(input: CreateAdminSchoolInput) {
  const data = await apiClient.post<{ school: ApiAdminSchool }>("/admin/schools", input);
  return adaptAdminSchool(data.school);
}

export async function updateAdminSchoolStatus(id: string, status: string, reason?: string) {
  const data = await apiClient.patch<{ school: ApiAdminSchool }>(`/admin/schools/${id}/status`, { status, reason });
  return adaptAdminSchool(data.school);
}
