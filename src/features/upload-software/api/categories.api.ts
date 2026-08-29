import { useQuery } from '@tanstack/react-query';
import api from '../../../API_Wrapper';
import { queryKeys } from '../../../shared/lib/query/query-keys';

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface CategoriesResponse {
  items: Category[];
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_prev: boolean;
}

export function useCategories(limit = 200) {
  return useQuery({
    queryKey: [...queryKeys.software.all, 'categories', { limit }],
    queryFn: async (): Promise<Category[]> => {
      const response = await api.get('/api/v1/categories', {
        params: { limit, offset: 0 },
      });
      
      const data = response.data;
      
      // Handle paginated response from backend
      if (data && typeof data === 'object' && 'items' in data) {
        return (data as CategoriesResponse).items.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          description: item.description ?? null,
        }));
      }
      
      // Handle array response directly
      return Array.isArray(data)
        ? data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            description: item.description ?? null,
          }))
        : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get('/api/v1/categories', {
    params: { limit: 200, offset: 0 },
  });
  
  const data = response.data;
  
  if (data && typeof data === 'object' && 'items' in data) {
    return (data as CategoriesResponse).items.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      description: item.description ?? null,
    }));
  }
  
  return Array.isArray(data)
    ? data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description ?? null,
      }))
    : [];
}