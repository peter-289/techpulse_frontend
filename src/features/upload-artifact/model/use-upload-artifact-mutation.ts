import { useMutation } from '@tanstack/react-query';
import { uploadArtifact } from '../api/upload-artifact.api';
import type { UploadArtifactInput } from '../model/upload-artifact.schema';

export function useUploadArtifactMutation(onUploadProgress?: (pct: number) => void) {
  return useMutation({
    mutationFn: (input: UploadArtifactInput) => uploadArtifact(input, onUploadProgress),
  });
}
