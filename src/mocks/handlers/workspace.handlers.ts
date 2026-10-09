import { http, HttpResponse } from 'msw';

const now = () => new Date().toISOString();

export const workspaceHandlers = [
  http.get('/api/v1/software-management/admin/summary', () =>
    HttpResponse.json({
      total_packages: 4,
      total_versions: 9,
      published_versions: 6,
      total_downloads: 1234,
    }),
  ),
  http.get('/api/v1/software-management/admin/packages', () =>
    HttpResponse.json([
      {
        package_id: 'pkg-1',
        name: 'Sonic Booster',
        latest_version: '2.4.0',
        owner_id: 'user-1',
        is_public: true,
        status: 'Approved',
        download_count: 6918,
        created_at: now(),
      },
    ]),
  ),
  http.get('/api/v1/software-management/artifacts', () => HttpResponse.json([])),
  http.get('/api/v1/security/scans', () => HttpResponse.json([])),
  http.get('/api/v1/analytics', () => HttpResponse.json({})),
  http.get('/api/v1/admin/alerts', () => HttpResponse.json({ items: [] })),
  http.get('/api/v1/admin/audit-events', () => HttpResponse.json({ items: [] })),
  http.get('/api/v1/support-chat/messages', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 50);
    return HttpResponse.json(
      Array.from({ length: Math.min(limit, 5) }).map((_, index) => ({
        id: `msg-${index + 1}`,
        content: `Mock support message ${index + 1}`,
        role: index % 2 === 0 ? 'user' : 'assistant',
        created_at: now(),
      })),
    );
  }),
  http.post('/api/v1/support-chat/messages', async ({ request }) => {
    const body = (await request.json()) as { content?: string };
    return HttpResponse.json(
      {
        id: `msg-${Date.now()}`,
        content: `Thanks for reaching out — I received: "${body?.content ?? ''}".`,
        role: 'assistant',
        created_at: now(),
      },
      { status: 201 },
    );
  }),
  http.get('/api/v1/categories', () =>
    HttpResponse.json([
      { id: 'developer-tools', name: 'Developer Tools' },
      { id: 'security-tools', name: 'Security Tools' },
    ]),
  ),
  http.post('/api/v1/software-management/upload', () =>
    HttpResponse.json({ software_id: 'pkg-new', version: '1.0.0', detail: 'Uploaded' }, { status: 201 }),
  ),
  http.post('/api/v1/software-management/:id/versions/upload', () =>
    HttpResponse.json(
      {
        id: 'ver-new',
        software_id: 'pkg-1',
        version: '1.1.0',
        is_published: true,
        status: 'published',
        created_at: now(),
      },
      { status: 201 },
    ),
  ),
  http.post('/api/v1/software-management/:id/versions/:version/deprecate', () => HttpResponse.json({ ok: true })),
  http.post('/api/v1/software-management/:id/versions/:version/revoke', () => HttpResponse.json({ ok: true })),
  http.patch('/api/v1/software-management/:id/pricing', () => HttpResponse.json({ ok: true })),
  http.post('/api/v1/payments/checkout', () => HttpResponse.json({ id: 'pay-1', status: 'completed' })),
  http.post('/api/v1/payments/checkout/:id/confirm', () => HttpResponse.json({ id: 'pay-1', status: 'completed' })),
  http.patch('/api/v1/users/:id', () => HttpResponse.json({ ok: true })),
  http.patch('/api/v1/software-management/admin/packages/:id', () => HttpResponse.json({ ok: true })),
  http.patch('/api/v1/admin/alerts/:id/ack', () => HttpResponse.json({ ok: true })),
];
