import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/shared/api/http-client';
import { uploadArtifact } from './upload-artifact.api';
import type { SoftwareUploadInput } from '../model/upload-software.schema';

vi.mock('@/shared/api/http-client', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

const postMock = vi.mocked(httpClient.post);

function createInput(visibility: boolean): SoftwareUploadInput {
  return {
    name: 'TechPulse CLI',
    description: 'A command line package for managing TechPulse software.',
    categoryId: '11111111-1111-4111-8111-111111111111',
    visibility,
    price: 12.5,
    currency: 'USD',
    version: '1.0.0',
    changelog: 'Initial release',
    files: [new File(['artifact'], 'techpulse.zip', { type: 'application/zip' })],
  };
}

describe('uploadArtifact', () => {
  beforeEach(() => {
    postMock.mockClear();
    postMock.mockResolvedValue({ data: {} } as never);
  });

  it('maps public visibility and upload metadata to the backend multipart contract', async () => {
    await uploadArtifact(createInput(true));

    const formData = postMock.mock.calls[0]?.[1] as FormData;
    expect(formData.get('visibility')).toBe('public');
    expect(formData.get('software_name')).toBe('TechPulse CLI');
    expect(formData.get('software_description')).toBe(
      'A command line package for managing TechPulse software.',
    );
    expect(formData.get('price_cents')).toBe('1250');
    expect(formData.get('release_notes')).toBe('Initial release');
    expect(formData.getAll('files')).toHaveLength(1);
  });

  it('maps private visibility to the backend enum value', async () => {
    await uploadArtifact(createInput(false));

    const formData = postMock.mock.calls[0]?.[1] as FormData;
    expect(formData.get('visibility')).toBe('private');
  });
});
