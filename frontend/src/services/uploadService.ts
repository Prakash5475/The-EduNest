import { apiClient } from "./apiClient";

export interface UploadedFileResult {
  id: string;
  fileName: string;
  filePath: string;
}

export async function uploadImage(file: File): Promise<UploadedFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await apiClient.post<{ file: UploadedFileResult }>("/uploads/image", undefined, { formData });
  return data.file;
}

export async function uploadDocument(file: File): Promise<UploadedFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  const data = await apiClient.post<{ file: UploadedFileResult }>("/uploads/document", undefined, { formData });
  return data.file;
}
