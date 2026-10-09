import { describe, expect, it, vi } from 'vitest';
import { errorMessageFrom, notifyToast, subscribeToToasts } from './toast';

describe('toast bus', () => {
  it('emits and receives toast events', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeToToasts(handler);
    notifyToast({ title: 'Hello', variant: 'success' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toMatchObject({ title: 'Hello', variant: 'success' });
    expect(typeof handler.mock.calls[0]?.[0]?.id).toBe('string');
    unsubscribe();
    notifyToast({ title: 'Ignored' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('honours an explicit id', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeToToasts(handler);
    notifyToast({ id: 'fixed', title: 'x' });
    expect(handler.mock.calls[0]?.[0]?.id).toBe('fixed');
    unsubscribe();
  });
});

describe('errorMessageFrom', () => {
  it('extracts a string detail', () => {
    expect(errorMessageFrom({ response: { data: { detail: 'Nope' } } })).toBe('Nope');
  });

  it('joins array details', () => {
    const message = errorMessageFrom({
      response: { data: { detail: [{ msg: 'A' }, { message: 'B' }, 'C'] } },
    });
    expect(message).toBe('A\nB\nC');
  });

  it('supports err.details.detail and plain messages', () => {
    expect(errorMessageFrom({ details: { detail: 'Deep' } })).toBe('Deep');
    expect(errorMessageFrom({ message: 'Raw' })).toBe('Raw');
    expect(errorMessageFrom({ response: { data: { error: 'Oops' } } })).toBe('Oops');
  });

  it('returns the fallback when nothing matches', () => {
    expect(errorMessageFrom({}, 'fallback')).toBe('fallback');
    expect(errorMessageFrom(null)).toBe('Something went wrong. Please try again.');
  });
});
