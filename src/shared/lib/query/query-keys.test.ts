import { describe, expect, it } from 'vitest';
import { queryKeys } from './query-keys';

describe('queryKeys', () => {
  it('namespaces software keys', () => {
    expect(queryKeys.software.all).toEqual(['software']);
    expect(queryKeys.software.list(10)).toEqual(['software', 'list', { limit: 10 }]);
    expect(queryKeys.software.detail('abc')).toEqual(['software', 'detail', 'abc']);
    expect(queryKeys.software.versions('abc', 5)).toEqual([
      'software',
      'versions',
      'abc',
      { limit: 5 },
    ]);
    expect(queryKeys.software.adminSummary()).toEqual(['software', 'admin-summary']);
  });

  it('namespaces categories, users, admin and support keys', () => {
    expect(queryKeys.categories.list(3)).toEqual(['categories', 'list', { limit: 3 }]);
    expect(queryKeys.users.me()).toEqual(['users', 'me']);
    expect(queryKeys.users.list(2)).toEqual(['users', 'list', { limit: 2 }]);
    expect(queryKeys.admin.dashboard()).toEqual(['admin', 'dashboard']);
    expect(queryKeys.admin.alerts(true, 4)).toEqual(['admin', 'alerts', { unack: true, limit: 4 }]);
    expect(queryKeys.admin.auditEvents(7)).toEqual(['admin', 'audit-events', { limit: 7 }]);
    expect(queryKeys.support.messages(9)).toEqual(['support', 'messages', { limit: 9 }]);
  });
});
