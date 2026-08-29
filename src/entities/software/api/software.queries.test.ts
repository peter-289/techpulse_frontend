import { describe, expect, it } from 'vitest';
import { normalizeSoftwareResponse } from './software.queries';

describe('normalizeSoftwareResponse', () => {
  it('extracts software items from a backend tuple response', () => {
    const responseData = [
      [
        {
          id: 'pkg-1',
          name: 'Alpha',
          description: 'First package',
          is_public: true,
          latest_version: '1.2.0',
          download_count: 12,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-05T00:00:00Z',
        },
      ],
      1,
    ];

    const result = normalizeSoftwareResponse(responseData);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'pkg-1',
      name: 'Alpha',
      latest_version: '1.2.0',
    });
  });

  it('accepts a direct array response as-is', () => {
    const responseData = [
      {
        id: 'pkg-2',
        name: 'Beta',
        description: 'Second package',
        is_public: false,
        latest_version: null,
        download_count: 0,
      },
    ];

    const result = normalizeSoftwareResponse(responseData);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Beta');
  });
});
