import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';

const invalidateAdmin = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string | number; status: string }) => {
      const response = await api.patch(`/api/v1/users/${userId}`, { status });
      return response.data;
    },
    onSuccess: () => invalidateAdmin(queryClient),
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string | number; role: string }) => {
      const response = await api.patch(`/api/v1/users/${userId}`, { role });
      return response.data;
    },
    onSuccess: () => invalidateAdmin(queryClient),
  });
}

export type UserProfileUpdate = {
  userId: string | number;
  fullName?: string;
  email?: string;
  role?: string;
};

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, fullName, email, role }: UserProfileUpdate) => {
      const payload: Record<string, string> = {};
      if (fullName !== undefined) payload.full_name = fullName;
      if (email !== undefined) payload.email = email;
      if (role !== undefined) payload.role = role;
      const response = await api.patch(`/api/v1/users/${userId}`, payload);
      return response.data;
    },
    onSuccess: () => invalidateAdmin(queryClient),
  });
}

type PackageDecision = 'approve' | 'reject' | 'quarantine';

export function useReviewSoftwarePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ packageId, decision }: { packageId: string | number; decision: PackageDecision }) => {
      const response = await api.patch(
        `/api/v1/software-management/admin/packages/${packageId}`,
        { action: decision },
      );
      return response.data;
    },
    onSuccess: () => invalidateAdmin(queryClient),
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string | number) => {
      const response = await api.patch(`/api/v1/admin/alerts/${alertId}/ack`);
      return response.data;
    },
    onSuccess: () => invalidateAdmin(queryClient),
  });
}
