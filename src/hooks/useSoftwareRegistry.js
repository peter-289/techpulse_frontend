import { useCallback } from 'react';
import { authApi as api } from '../API_Wrapper';

export default function useSoftwareRegistry() {
  const fetchSoftwareList = useCallback(async (limit = 120) => {
    const response = await api.get('/api/v1/software-management', { params: { limit } });
    return response.data || [];
  }, []);

  const fetchSoftwareVersions = useCallback(async (softwareId, limit = 20) => {
    const response = await api.get(`/api/v1/software-management/${softwareId}/versions`, {
      params: { limit },
    });
    return response.data || [];
  }, []);

  const updateVersionState = useCallback(async ({ softwareId, version, status }) => {
    if (!softwareId || !version || !status) {
      throw new Error('Missing lifecycle parameters');
    }
    const action = String(status).toLowerCase();
    if (action === 'deprecate' || action === 'deprecated') {
      const res = await api.post(`/api/v1/software-management/${softwareId}/versions/${version}/deprecate`);
      return res.data;
    }
    if (action === 'revoke' || action === 'revoked') {
      const res = await api.post(`/api/v1/software-management/${softwareId}/versions/${version}/revoke`);
      return res.data;
    }
    throw new Error(`Unsupported lifecycle action: ${status}`);
  }, []);

  return {
    fetchSoftwareList,
    fetchSoftwareVersions,
    updateVersionState,
  };
}
