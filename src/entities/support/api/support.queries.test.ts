import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createWrapper, renderHook } from '../../../test/render';
import { useSendSupportMessage } from './support.mutations';
import { useSupportMessages } from './support.queries';

describe('support queries', () => {
  it('loads support messages', async () => {
    const { result } = renderHook(() => useSupportMessages(5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(5);
    expect(result.current.data?.[0]?.user_message).toContain('Mock support message');
  });

  it('sends a support message', async () => {
    const { result } = renderHook(() => useSendSupportMessage(), { wrapper: createWrapper() });
    const message = await result.current.mutateAsync('Hello support');
    expect(message.role).toBe('assistant');
    expect(message.assistant_message).toContain('Hello support');
  });
});
