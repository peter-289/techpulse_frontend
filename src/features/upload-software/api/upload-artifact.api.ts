import type { SoftwareUploadInput, SoftwareUploadResponse } from '../model/upload-software.schema';
import { httpClient } from '@/shared/api/http-client';

/**
 * Upload software artifacts to the backend
 * @param input - Software upload form data
 * @param onProgress - Callback for upload progress (0-100)
 * @returns Upload response with software and version details
 */
export async function uploadArtifact(
  input: SoftwareUploadInput,
  onProgress?: (progress: number) => void
): Promise<SoftwareUploadResponse> {
  const formData = new FormData();

  // Add metadata fields (map to backend snake_case)
  formData.append('software_name', input.name);
  formData.append('software_description', input.description);
  formData.append('category_id', input.categoryId);
  formData.append('visibility', input.visibility ? 'public' : 'private');
  if (input.price != null) {
    formData.append('price_cents', String(Math.round(Number(input.price) * 100)));
  }
  formData.append('currency', input.currency);
  formData.append('version', input.version);
  if (input.changelog) {
    formData.append('release_notes', input.changelog);
  }

  // Add files
  if (input.files && input.files.length > 0) {
    // Handle both File[] and FileList
    const filesArray = Array.from(input.files);
    filesArray.forEach((file) => {
      formData.append('files', file);
    });
  }

  try {
    const response = await httpClient.post('/api/v1/software-management/upload', formData, {
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data as SoftwareUploadResponse;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Upload artifact error:', error);
    }
    throw error;
  }
}
