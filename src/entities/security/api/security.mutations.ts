import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/shared/api/http-client';
import { queryKeys } from '../../../shared/lib/query/query-keys';

export function useRescanArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (artifactId: string) => {
      const response = await httpClient.post('/api/v1/security/scan', { artifact_id: artifactId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.software.all }),
  });
}
