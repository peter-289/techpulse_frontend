import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../mocks/server';
import { createWrapper, renderHook } from '../../../test/render';
import { useAdminDashboardData } from './admin-dashboard.queries';

describe('useAdminDashboardData', () => {
  it('assembles the dashboard from server data', async () => {
    const { result } = renderHook(() => useAdminDashboardData(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toHaveLength(1);
    expect(result.current.software).toHaveLength(1);
    expect(result.current.summary).toMatchObject({ total_packages: 4 });
    expect(result.current.lastSyncAt).toBeTruthy();
    expect(result.current.feedback).toBeNull();
  });

  it('applies optimistic user and software updates', async () => {
    const { result } = renderHook(() => useAdminDashboardData(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateUserStatus('user-1', 'Suspended');
    });
    await act(async () => {
      await result.current.assignUserRole('user-1', 'admin');
    });
    await act(async () => {
      await result.current.approveSoftware('pkg-1');
      await result.current.rejectSoftware('pkg-1');
      await result.current.quarantineSoftware('pkg-1');
    });
    expect(result.current.feedback).toBeNull();
  });

  it('surfaces a feedback error and refetches when an action fails', async () => {
    server.use(
      http.patch('/api/v1/users/:id', () =>
        HttpResponse.json({ detail: 'Nope' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useAdminDashboardData(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateUserStatus('user-1', 'Suspended');
    });
    await waitFor(() => expect(result.current.feedback).not.toBeNull());
    expect(result.current.feedback).toMatchObject({ variant: 'error', title: 'Action failed' });
  });

  it('acknowledges a notification', async () => {
    const { result } = renderHook(() => useAdminDashboardData(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markNotificationRead({ id: 'n1', apiId: 'a1', unread: true });
    });
    expect(result.current.feedback).toBeNull();
  });
});
