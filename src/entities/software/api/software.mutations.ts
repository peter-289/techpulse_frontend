import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';
import { softwareVersionSchema, type SoftwareVersion } from '../model/software.schema';

function invalidateSoftware(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.software.all });
}

export type UploadVersionInput = {
  softwareId: string | number;
  version: string;
  releaseNotes?: string;
  file?: File;
  files?: File[];
  onUploadProgress?: (event: { loaded: number; total?: number }) => void;
};

/** Upload a new artifact version for an existing software package. */
export function useUploadVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadVersionInput): Promise<SoftwareVersion> => {
      const payload = new FormData();
      payload.append('version', input.version);
      payload.append('release_notes', input.releaseNotes || '');
      const files = input.files?.length ? input.files : input.file ? [input.file] : [];
      if (!files.length) throw new Error('At least one artifact is required.');
      files.forEach((file) => payload.append('files', file));
      const config: Parameters<typeof api.post>[2] = {
        headers: { 'Content-Type': 'multipart/form-data' },
      };
      if (input.onUploadProgress) config.onUploadProgress = input.onUploadProgress;
      const response = await api.post(
        `/api/v1/software-management/${input.softwareId}/versions/upload`,
        payload,
        config,
      );
      return softwareVersionSchema.parse(response.data);
    },
    onSuccess: () => invalidateSoftware(queryClient),
  });
}

export type VersionLifecycleInput = {
  softwareId: string | number;
  version: string;
  status: string;
};

const lifecycleEndpoint = (status: string): string | null => {
  const action = status.toLowerCase();
  if (action.startsWith('deprecat')) return 'deprecate';
  if (action.startsWith('revok')) return 'revoke';
  if (action.startsWith('archiv')) return 'archive';
  return null;
};

/** Apply a supported lifecycle transition to a released version. */
export function useVersionLifecycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ softwareId, version, status }: VersionLifecycleInput) => {
      const endpoint = lifecycleEndpoint(status);
      if (!endpoint) throw new Error(`Unsupported lifecycle action: ${status}`);
      const response = await api.post(
        `/api/v1/software-management/${softwareId}/versions/${version}/${endpoint}`,
      );
      return response.data;
    },
    onSuccess: () => invalidateSoftware(queryClient),
  });
}

export type UpdatePricingInput = {
  softwareId: string | number;
  priceCents: number;
  currency?: string;
};

/** Update the price/currency for a software package. */
export function useUpdatePricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ softwareId, priceCents, currency = 'USD' }: UpdatePricingInput) => {
      const response = await api.patch(`/api/v1/software-management/${softwareId}/pricing`, {
        price_cents: Number(priceCents || 0),
        currency,
      });
      return response.data;
    },
    onSuccess: () => invalidateSoftware(queryClient),
  });
}

export type PaymentSession = {
  id: string;
  checkout_url?: string | null;
  provider_reference?: string | null;
  status?: string | null;
};

/**
 * Project purchase adapter. Plan (subscription) billing is out of scope;
 * this covers one-off project access and degrades gracefully when the
 * payment provider endpoint is unavailable.
 */
export function useCreateCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (softwareId: string | number): Promise<PaymentSession> => {
      const response = await api.post('/api/v1/payments/checkout', { software_id: softwareId });
      return response.data as PaymentSession;
    },
    onSuccess: () => invalidateSoftware(queryClient),
  });
}

export function useConfirmCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string): Promise<PaymentSession> => {
      const response = await api.post(`/api/v1/payments/checkout/${paymentId}/confirm`);
      return response.data as PaymentSession;
    },
    onSuccess: () => invalidateSoftware(queryClient),
  });
}
