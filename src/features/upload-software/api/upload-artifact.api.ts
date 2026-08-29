import type { SoftwareUploadInput, SoftwareUploadResponse } from '../model/upload-software.schema';
import api from '../../../API_Wrapper';

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

  // Add metadata fields
  formData.append('name', input.name);
  formData.append('description', input.description);
  formData.append('categoryId', input.categoryId);
  formData.append('visibility', String(input.visibility));
  formData.append('price', String(input.price));
  formData.append('currency', input.currency);
  formData.append('version', input.version);
  formData.append('changelog', input.changelog || '');

  // Add files
  if (input.files && input.files.length > 0) {
    // Handle both File[] and FileList
    const filesArray = Array.from(input.files);
    filesArray.forEach((file) => {
      formData.append('files', file);
    });
  }

  try {
    const response = await api.post('/api/v1/software/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data as SoftwareUploadResponse;
  } catch (error) {
    console.error('Upload artifact error:', error);
    throw error;
  }
}
