import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient as api } from '@/shared/api/http-client';

export type AdminCategory = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  parent_id: string | null;
  deleted_at: string | null;
};

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async (): Promise<AdminCategory[]> => {
      const response = await api.get('/api/v1/categories', { params: { limit: 200, include_deleted: true } });
      return response.data?.items ?? [];
    },
  });
}

export function useBulkCreateCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categories: Array<{ name: string; slug?: string; description?: string }>) => {
      const response = await api.post('/api/v1/categories/bulk', { categories });
      return response.data as AdminCategory[];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}
