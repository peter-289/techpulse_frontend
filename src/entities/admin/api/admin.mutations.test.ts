import { describe, expect, it } from 'vitest';
import { createWrapper, renderHook } from '../../../test/render';
import {
  useAcknowledgeAlert,
  useAssignUserRole,
  useReviewSoftwarePackage,
  useUpdateUserProfile,
  useUpdateUserStatus,
} from './admin.mutations';

describe('admin mutations', () => {
  it('updates a user status', async () => {
    const { result } = renderHook(() => useUpdateUserStatus(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ userId: 'u1', status: 'Suspended' })).resolves.toBeTruthy();
  });

  it('assigns a user role', async () => {
    const { result } = renderHook(() => useAssignUserRole(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ userId: 'u1', role: 'admin' })).resolves.toBeTruthy();
  });

  it('builds a profile update payload and skips undefined values', async () => {
    const { result } = renderHook(() => useUpdateUserProfile(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ userId: 'u1', fullName: 'Ada Lovelace', email: 'ada@example.test' }),
    ).resolves.toBeTruthy();
  });

  it('reviews a software package', async () => {
    const { result } = renderHook(() => useReviewSoftwarePackage(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ packageId: 'pkg-1', decision: 'approve' }),
    ).resolves.toBeTruthy();
  });

  it('acknowledges an alert', async () => {
    const { result } = renderHook(() => useAcknowledgeAlert(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('alert-1')).resolves.toBeTruthy();
  });
});
