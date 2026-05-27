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
  created_at: new Date().toISOString(),
}));

export const handlers = [
  http.get('/api/v1/software-management', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 100);
    return HttpResponse.json(sampleSoftware.slice(0, limit));
  }),
  http.get('/api/v1/support-chat/messages', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 100);
    const messages = Array.from({ length: limit }).map((_, i) => ({
      id: `msg-${i + 1}`,
      content: `Mock support message ${i + 1}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      created_at: new Date().toISOString(),
    }));
    return HttpResponse.json(messages);
  }),
];
