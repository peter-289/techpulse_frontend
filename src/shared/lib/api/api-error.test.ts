import { describe, expect, it } from 'vitest';
import { ApiError, normalizeAxiosError } from './api-error';

describe('ApiError', () => {
  it('preserves its prototype and fields', () => {
    const error = new ApiError(404, 'Not found', { id: 1 }, 'NOT_FOUND');
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toEqual({ id: 1 });
    expect(error.isNetworkError).toBe(false);
  });
});

describe('normalizeAxiosError', () => {
  it('maps a missing response to a network error', () => {
    const result = normalizeAxiosError({ message: 'boom' });
    expect(result.status).toBe(0);
    expect(result.isNetworkError).toBe(true);
    expect(result.code).toBe('NETWORK_ERROR');
  });

  it('prefers response detail for the message', () => {
    const result = normalizeAxiosError({
      response: { status: 422, data: { detail: 'Invalid payload', code: 'VALIDATION' } },
    });
    expect(result.status).toBe(422);
    expect(result.message).toBe('Invalid payload');
    expect(result.code).toBe('VALIDATION');
    expect(result.isNetworkError).toBe(false);
  });

  it('falls back to message then error then a default', () => {
    expect(normalizeAxiosError({ response: { status: 400, data: { message: 'Bad' } } }).message).toBe('Bad');
    expect(normalizeAxiosError({ response: { status: 400, data: {} }, message: 'raw' }).message).toBe('raw');
    expect(normalizeAxiosError({ response: { status: 500, data: {} } }).message).toBe('Unexpected error occurred');
  });
});
