/**
 * API error class for normalized error handling
 */
export class ApiError extends Error {
  /** HTTP status code (0 for network errors) */
  public status: number;
  /** Optional error code */
  public code?: string | undefined;
  /** Additional error details */
  public details?: unknown;
  /** Whether this is a network error */
  public isNetworkError: boolean;

  constructor(
    status: number,
    message: string,
    details?: unknown,
    code?: string,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Read the HTTP status from either a normalized ApiError or a raw Axios error.
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  return (error as { response?: { status?: number } })?.response?.status;
}

/**
 * Read the most useful error detail string from either a normalized ApiError
 * or a raw Axios error.
 */
export function getErrorDetail(error: unknown): string | undefined {
  const candidate = error as {
    details?: unknown;
    response?: { data?: unknown };
    message?: string;
  };
  const data = candidate?.details ?? candidate?.response?.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const detail = (data as { detail?: unknown; message?: unknown; error?: unknown }).detail;
    if (typeof detail === 'string') return detail;
    const message =
      (data as { message?: unknown; error?: unknown }).message ??
      (data as { error?: unknown }).error;
    if (typeof message === 'string') return message;
  }
  if (typeof candidate?.message === 'string') return candidate.message;
  return undefined;
}

/**
 * Normalize Axios error to ApiError
 */
export function normalizeAxiosError(error: any): ApiError {
  if (!error.response) {
    return new ApiError(
      0,
      'Network error. Please check your connection.',
      error,
      'NETWORK_ERROR',
      true
    );
  }
  const status = error.response.status;
  const data = error.response.data as any;
  const message =
    data?.detail ?? data?.message ?? data?.error ?? error.message ?? 'Unexpected error occurred';
  const code = data?.code;
  return new ApiError(status, message, data, code, false);
}
