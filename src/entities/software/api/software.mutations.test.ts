import { describe, expect, it } from 'vitest';
import { createWrapper, renderHook } from '../../../test/render';
import {
  useConfirmCheckout,
  useCreateCheckout,
  useUpdatePricing,
  useUploadVersion,
  useVersionLifecycle,
} from './software.mutations';

describe('software mutations', () => {
  it('uploads a new version', async () => {
    const { result } = renderHook(() => useUploadVersion(), { wrapper: createWrapper() });
    const file = new File(['content'], 'package.tar.gz', { type: 'application/gzip' });
    const version = await result.current.mutateAsync({
      softwareId: 'pkg-1',
      version: '1.1.0',
      releaseNotes: 'notes',
      file,
    });
    expect(version.version).toBe('1.1.0');
    expect(version.software_id).toBe('pkg-1');
  });

  it('deprecates and revokes versions', async () => {
    const { result } = renderHook(() => useVersionLifecycle(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ softwareId: 'pkg-1', version: '1.0.0', status: 'Deprecated' }),
    ).resolves.toBeTruthy();
    await expect(
      result.current.mutateAsync({ softwareId: 'pkg-1', version: '1.0.0', status: 'Revoked' }),
    ).resolves.toBeTruthy();
  });

  it('rejects unsupported lifecycle actions', async () => {
    const { result } = renderHook(() => useVersionLifecycle(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ softwareId: 'pkg-1', version: '1.0.0', status: 'Archived' }),
    ).rejects.toThrow('Unsupported lifecycle action: Archived');
  });

  it('updates pricing', async () => {
    const { result } = renderHook(() => useUpdatePricing(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ softwareId: 'pkg-1', priceCents: 1900, currency: 'EUR' }),
    ).resolves.toBeTruthy();
  });

  it('creates and confirms a checkout session', async () => {
    const { result: create } = renderHook(() => useCreateCheckout(), { wrapper: createWrapper() });
    const session = await create.current.mutateAsync('pkg-1');
    expect(session.id).toBe('pay-1');

    const { result: confirm } = renderHook(() => useConfirmCheckout(), { wrapper: createWrapper() });
    const confirmed = await confirm.current.mutateAsync('pay-1');
    expect(confirmed.status).toBe('completed');
  });
});
