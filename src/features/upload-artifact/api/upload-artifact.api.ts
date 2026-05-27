import { authApi as api } from '../../../API_Wrapper';
import type { UploadArtifactInput } from '../model/upload-artifact.schema';

export async function uploadArtifact(input: UploadArtifactInput, onUploadProgress?: (pct: number) => void) {
  const payload = new FormData();
  payload.append('software_name', input.name);

  const descriptionParts = [input.description.trim(), `Category: ${input.category}`];
  if (input.changelog?.trim()) descriptionParts.push(`Release notes: ${input.changelog.trim()}`);

  payload.append('software_description', descriptionParts.join('\n\n'));
  payload.append('version', input.version);
  payload.append('is_public', String(input.isPublic));
  payload.append('price_cents', String(Math.max(0, Math.round(Number(input.price || 0) * 100))));
  payload.append('currency', input.currency || 'USD');
  payload.append('file', input.file);

  const response = await api.post('/api/v1/software-management/upload', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (!evt.total) return;
      onUploadProgress?.(Math.round((evt.loaded / evt.total) * 100));
    },
  });

  return response.data || {};
}
