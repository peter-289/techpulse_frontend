import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createWrapper, renderHook } from '../../../test/render';
import {
  buildSoftwareDownloadUrl,
  useSoftwareAdminSummary,
  useSoftwareDetail,
  useSoftwareList,
  useSoftwareVersion,
  useSoftwareVersions,
  useSoftwareVersionsFeed,
} from './software.queries';

describe('software query hooks', () => {
  it('loads and parses the software list', async () => {
    const { result } = renderHook(() => useSoftwareList(5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(5);
    expect(result.current.data?.[0]).toMatchObject({ id: 'pkg-1', name: 'Package 1' });
  });

  it('loads a software detail by id', async () => {
    const { result } = renderHook(() => useSoftwareDetail('pkg-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('pkg-1');
  });

  it('does not run detail queries without an id', () => {
    const { result } = renderHook(() => useSoftwareDetail(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('loads versions for a software package', async () => {
    const { result } = renderHook(() => useSoftwareVersions('pkg-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[2]?.artifact_status).toBe('quarantined');
  });

  it('builds a flat versions feed', async () => {
    const { result } = renderHook(() => useSoftwareVersionsFeed(3), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.data?.[0]?.softwareName).toBeDefined();
  });

  it('resolves a single version from the versions collection', async () => {
    const { result } = renderHook(() => useSoftwareVersion('pkg-1', '1.1.0'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.versionData?.version).toBe('1.1.0');

    const { result: missing } = renderHook(() => useSoftwareVersion('pkg-1', '9.9.9'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(missing.current.isSuccess).toBe(true));
    expect(missing.current.versionData).toBeNull();
  });

  it('loads the admin summary', async () => {
    const { result } = renderHook(() => useSoftwareAdminSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ total_packages: 4, total_downloads: 1234 });
  });

  it('builds an encoded download url', () => {
    expect(buildSoftwareDownloadUrl('pkg-1', '1.0.0')).toBe(
      '/api/v1/software-management/pkg-1/versions/1.0.0/download',
    );
    expect(buildSoftwareDownloadUrl('pkg 1', 'v/1')).toContain('v%2F1');
  });
});
