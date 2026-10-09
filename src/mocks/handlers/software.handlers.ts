import { http, HttpResponse } from 'msw';

const sampleSoftware = Array.from({ length: 16 }).map((_, index) => ({
  id: `pkg-${index + 1}`,
  name: `Package ${index + 1}`,
  description: 'Mocked package payload for local-first development and UI testing.',
  owner_id: `user-${(index % 4) + 1}`,
  is_public: index % 3 !== 0,
  category: ['developer tools', 'security tools', 'networking software'][index % 3],
  price_cents: index % 5 === 0 ? 1900 : 0,
  currency: 'USD',
  latest_version: `1.${index}.0`,
  download_count: index * 12,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

export const handlers = [
  http.get('/api/v1/software-management', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 100);
    return HttpResponse.json(sampleSoftware.slice(0, limit));
  }),
  http.get('/api/v1/software-management/:id/versions', () => {
    return HttpResponse.json(
      Array.from({ length: 3 }).map((_, index) => ({
        id: `ver-${index + 1}`,
        software_id: 'pkg-1',
        version: `1.${index}.0`,
        is_published: true,
        status: 'published',
        download_count: 10 * index,
        release_notes: 'Mock release notes',
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        file_hash: 'abc123',
        size_bytes: 1024 * (index + 1),
        content_type: 'application/gzip',
        file_name: `package-1.${index}.0.tar.gz`,
        artifact_status: index === 2 ? 'quarantined' : 'active',
        quarantine_reason: index === 2 ? 'Signature match' : null,
      })),
    );
  }),
  http.get('/api/v1/software-management/:id', ({ params }) => {
    const item = sampleSoftware.find((row) => row.id === params.id) ?? sampleSoftware[0];
    return HttpResponse.json(item);
  }),
];
