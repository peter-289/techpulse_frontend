import { type Page } from '@playwright/test';

export const defaultUser = {
  id: 'user-1',
  username: 'ada',
  full_name: 'Ada Lovelace',
  email: 'ada@example.test',
  role: 'viewer',
};

export const adminUser = { ...defaultUser, role: 'admin' };

export const softwareList = [
  {
    id: 'pkg-1',
    name: 'Aurora CLI',
    description: 'Command line toolkit',
    category: 'developer tools',
    is_public: true,
    price_cents: 0,
    currency: 'USD',
    latest_version: '1.2.0',
    download_count: 120,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pkg-2',
    name: 'Sentinel Scan',
    description: 'Static analysis engine',
    category: 'security tools',
    is_public: false,
    price_cents: 1900,
    currency: 'USD',
    latest_version: '2.0.0',
    download_count: 45,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-06T00:00:00Z',
  },
];

const versions = [
  {
    id: 'ver-1',
    software_id: 'pkg-1',
    version: '1.2.0',
    is_published: true,
    status: 'published',
    download_count: 120,
    release_notes: 'Stable release',
    created_at: '2026-01-05T00:00:00Z',
    published_at: '2026-01-05T00:00:00Z',
    file_hash: 'abc',
    size_bytes: 2048,
    content_type: 'application/gzip',
    file_name: 'aurora-cli-1.2.0.tar.gz',
    artifact_status: 'active',
    quarantine_reason: null,
  },
];

const adminPackages = [
  {
    package_id: 'pkg-1',
    name: 'Aurora CLI',
    latest_version: '1.2.0',
    owner_id: 'user-1',
    is_public: true,
    status: 'Approved',
    download_count: 120,
    created_at: '2026-01-01T00:00:00Z',
  },
];

/**
 * Install hermetic API mocks so e2e specs can run against the SPA without a
 * live backend. Pass `user: null` to simulate an unauthenticated session.
 */
export async function installApiMocks(
  page: Page,
  options: { user?: Record<string, unknown> | null } = {},
) {
  const user = options.user === undefined ? defaultUser : options.user;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (method === 'GET' && path === '/api/v1/users/me') {
      return user ? json(user) : json({ detail: 'Unauthorized' }, 401);
    }
    if (method === 'POST' && path === '/api/v1/auth/login') return json({ access_token: 'token' });
    if (method === 'POST' && path === '/api/v1/auth/logout') return json({ detail: 'ok' });
    if (method === 'POST' && path === '/api/v1/auth/refresh') return json({ access_token: 'token' });
    if (method === 'POST' && path === '/api/v1/auth/password-reset/requests') {
      return json({ detail: 'If the e-mail is registered, you will receive a reset link.' });
    }
    if (method === 'POST' && path === '/api/v1/auth/password-reset/confirm') {
      return json({ detail: 'Password updated' });
    }
    if (method === 'GET' && path === '/api/v1/auth/email-verification') {
      return json({ detail: 'Email verified' });
    }
    if (method === 'POST' && path === '/api/v1/auth/email-verification/resend') {
      return json({ detail: 'Verification email re-sent' });
    }
    if (method === 'POST' && path === '/api/v1/users') {
      return json({ id: 'user-2', detail: 'User created' }, 201);
    }
    if (method === 'GET' && path === '/api/v1/software-management/admin/summary') {
      return json({ total_packages: 2, total_versions: 1, published_versions: 1, total_downloads: 165 });
    }
    if (method === 'GET' && path === '/api/v1/software-management/admin/packages') {
      return json(adminPackages);
    }
    if (method === 'GET' && path === '/api/v1/users') return json([user ?? defaultUser]);
    if (method === 'GET' && path === '/api/v1/admin/alerts') return json({ items: [] });
    if (method === 'GET' && path === '/api/v1/admin/audit-events') return json({ items: [] });
    if (method === 'GET' && path === '/api/v1/support-chat/messages') return json([]);
    if (method === 'GET' && path === '/api/v1/categories') {
      return json([{ id: 'developer-tools', name: 'Developer Tools' }]);
    }
    if (method === 'GET' && /\/api\/v1\/software-management\/[^/]+\/versions$/.test(path)) {
      return json(versions);
    }
    if (method === 'GET' && path === '/api/v1/software-management') return json(softwareList);
    if (method === 'GET' && path === '/api/v1/software-management/artifacts') return json([]);
    if (method === 'GET' && path === '/api/v1/security/scans') return json([]);
    if (method === 'GET' && path === '/api/v1/analytics') return json({});
    if (method === 'GET' && /^\/api\/v1\/software-management\/[^/]+$/.test(path)) {
      const id = path.split('/').pop();
      return json(softwareList.find((item) => item.id === id) ?? softwareList[0]);
    }

    return json({}, 200);
  });
}
