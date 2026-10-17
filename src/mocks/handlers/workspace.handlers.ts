import { http, HttpResponse } from 'msw';

const now = () => new Date().toISOString();

const sampleUsers = [
  {
    id: 'user-1',
    full_name: 'Admin User',
    username: 'admin',
    email: 'admin@techpulse.local',
    role: 'ADMIN',
    status: 'VERIFIED',
    created_at: now(),
    updated_at: now(),
  },
];


const sampleAlerts = [
  {
    id: 'a1',
    rule_code: 'AUTH_BRUTE_FORCE_IP',
    severity: 'high',
    title: 'Brute force attempt detected',
    description: 'Multiple failed login attempts from IP 1.2.3.4',
    actor_user_id: null,
    ip_address: '1.2.3.4',
    audit_event_id: null,
    acknowledged: false,
    acknowledged_at: null,
    acknowledged_by_user_id: null,
    created_at: now(),
  },
  {
    id: 'a2',
    rule_code: 'EXCESSIVE_FORBIDDEN_REQUESTS',
    severity: 'medium',
    title: 'Excessive forbidden requests',
    description: 'User exceeded rate limit on API endpoints',
    actor_user_id: 'user-1',
    ip_address: '5.6.7.8',
    audit_event_id: 'ev-1',
    acknowledged: true,
    acknowledged_at: now(),
    acknowledged_by_user_id: 'user-1',
    created_at: now(),
  },
];

const sampleAuditEvents = [
  {
    id: 'ev-1',
    event_type: 'auth.login.failed',
    actor_user_id: 'user-1',
    method: 'POST',
    path: '/api/v1/auth/login',
    status_code: 401,
    ip_address: '1.2.3.4',
    user_agent: 'Mozilla/5.0',
    request_id: 'req-1',
    metadata: {},
    occurred_at: now(),
  },
  {
    id: 'ev-2',
    event_type: 'software.download',
    actor_user_id: 'user-2',
    method: 'GET',
    path: '/api/v1/software-management/pkg-1/download',
    status_code: 200,
    ip_address: '5.6.7.8',
    user_agent: 'Chrome/120.0',
    request_id: 'req-2',
    metadata: {},
    occurred_at: now(),
  },
];

export const workspaceHandlers = [
  http.get('/api/v1/software-management/summary', () =>
    HttpResponse.json({
      total_packages: 4,
      total_versions: 9,
      published_versions: 6,
      total_downloads: 1234,
    }),
  ),
  http.get('/api/v1/admin/software/summary', () =>
    HttpResponse.json({
      total_packages: 4,
      total_versions: 9,
      published_versions: 6,
      total_downloads: 1234,
    }),
  ),
  http.get('/api/v1/admin/software/packages', () =>
    HttpResponse.json([
      {
        package_id: 'pkg-1',
        name: 'Sonic Booster',
        owner_id: 'user-1',
        status: 'ACTIVE',
        download_count: 6918,
        created_at: now(),
        updated_at: now(),
      },
      {
        package_id: 'pkg-2',
        name: 'Video Converter',
        owner_id: 'user-2',
        status: 'ACTIVE',
        download_count: 3245,
        created_at: now(),
        updated_at: now(),
      },
    ]),
  ),
  http.get('/api/v1/software-management/artifacts', () =>
    HttpResponse.json(
      Array.from({ length: 4 }).map((_, index) => ({
        id: `artifact-${index + 1}`,
        artifact_id: `artifact-${index + 1}`,
        software_id: `pkg-${index + 1}`,
        software_name: `Package ${index + 1}`,
        version_id: `version-${index + 1}`,
        version: `1.${index}.0`,
        file_name: `package-${index + 1}.zip`,
        size_bytes: 1024 * (index + 1),
        sha256: `hash-${index + 1}`,
        content_type: 'application/zip',
        scan_status: 'completed',
        verdict: index === 2 ? 'malicious' : 'clean',
        created_at: now(),
        updated_at: now(),
      })),
    ),
  ),
  http.get('/api/v1/security/scans', () =>
    HttpResponse.json([
      {
        id: 'artifact-1',
        software_id: 'pkg-1',
        software_name: 'Package 1',
        version: '1.0.0',
        file_name: 'package-1.zip',
        provider: 'local',
        verdict: 'clean',
        updated_at: now(),
      },
      {
        id: 'artifact-2',
        software_id: 'pkg-2',
        software_name: 'Package 2',
        version: '1.1.0',
        file_name: 'package-2.zip',
        provider: 'local',
        verdict: 'malicious',
        quarantine_reason: 'Signature detected',
        updated_at: now(),
      },
    ]),
  ),
  http.get('/api/v1/admin/users', () => HttpResponse.json(sampleUsers)),
  http.get('/api/v1/admin/alerts', () => HttpResponse.json({ count: sampleAlerts.length, items: sampleAlerts })),
  http.get('/api/v1/admin/audit-events', () => HttpResponse.json({ count: sampleAuditEvents.length, items: sampleAuditEvents })),
  http.get('/api/v1/analytics', () => HttpResponse.json({})),
  http.get('/api/v1/support-chat/messages', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 50);
    return HttpResponse.json(
      Array.from({ length: Math.min(limit, 5) }).map((_, index) => ({
        id: `msg-${index + 1}`,
        user_id: 'user-1',
        user_message: index % 2 === 0 ? `Mock support message ${index + 1}` : `Question ${index + 1}`,
        assistant_message: index % 2 === 0 ? '' : `Mock support reply ${index + 1}`,
        role: index % 2 === 0 ? 'user' : 'assistant',
        created_at: now(),
      })),
    );
  }),
  http.post('/api/v1/support-chat/messages', async ({ request }) => {
    const body = (await request.json()) as { message?: string };
    return HttpResponse.json(
      {
        message_id: `msg-${Date.now()}`,
        assistant_reply: `Thanks for reaching out — I received: "${body?.message ?? ''}".`,
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
  http.post('/api/v1/software-management/:id/versions/:version/archive', () => HttpResponse.json({ ok: true })),
  http.patch('/api/v1/software-management/:id/pricing', () => HttpResponse.json({ ok: true })),
  http.post('/api/v1/payments/checkout', () => HttpResponse.json({ id: 'pay-1', status: 'completed' })),
  http.post('/api/v1/payments/checkout/:id/confirm', () => HttpResponse.json({ id: 'pay-1', status: 'completed' })),
  http.patch('/api/v1/admin/users/:id', () => HttpResponse.json({ ok: true })),
  http.patch('/api/v1/admin/software/packages/:id', () => HttpResponse.json({ ok: true })),
  http.patch('/api/v1/admin/alerts/:id/ack', () => HttpResponse.json({ ok: true })),
];
