import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createWrapper, renderHook } from '../../../test/render';
import { useArtifacts } from './artifact.queries';

describe('useArtifacts', () => {
  it('derives artifacts from the software catalogue when the endpoint is unavailable', async () => {
    const { result } = renderHook(() => useArtifacts(4), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(4);
    expect(result.current.data?.[0]).toMatchObject({ softwareName: 'Package 1', scanStatus: 'verified' });
  });
});
