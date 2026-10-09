import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { replyFor, useHelpMessagesStore } from './help-messages-store';

describe('replyFor', () => {
  it('matches known topics case-insensitively', () => {
    expect(replyFor('how do I UPLOAD?')).toContain('Upload Software');
    expect(replyFor('tell me about security')).toContain('scanned');
    expect(replyFor('tell me about versions')).toContain('Versions');
    expect(replyFor('billing question')).toContain('subscription');
    expect(replyFor('download the artifact')).toContain('Artifacts');
    expect(replyFor('review the audit trail')).toContain('Audit Center');
  });

  it('falls back for unknown topics', () => {
    expect(replyFor('hello there')).toContain('I can help with uploads');
  });
});

describe('useHelpMessagesStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useHelpMessagesStore.setState({ messages: [{ id: 'seed', role: 'assistant', text: 'hi', createdAt: 0 }] });
  });
  afterEach(() => vi.useRealTimers());

  it('ignores empty messages', () => {
    useHelpMessagesStore.getState().send('   ');
    expect(useHelpMessagesStore.getState().messages).toHaveLength(1);
  });

  it('appends a user message then an assistant reply', () => {
    useHelpMessagesStore.getState().send('How do I upload?');
    const afterUser = useHelpMessagesStore.getState().messages;
    expect(afterUser).toHaveLength(2);
    expect(afterUser[1]).toMatchObject({ role: 'user', text: 'How do I upload?' });

    vi.advanceTimersByTime(700);
    const afterReply = useHelpMessagesStore.getState().messages;
    expect(afterReply).toHaveLength(3);
    expect(afterReply[2]?.role).toBe('assistant');
    expect(afterReply[2]?.text).toContain('Upload Software');
  });

  it('removes a message by id', () => {
    useHelpMessagesStore.getState().send('hello');
    const target = useHelpMessagesStore.getState().messages[1];
    useHelpMessagesStore.getState().remove(String(target?.id));
    expect(useHelpMessagesStore.getState().messages).toHaveLength(1);
  });
});
