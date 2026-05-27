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

  const uploadSoftwareVersion = useCallback(async ({ softwareId, version, releaseNotes, file, onUploadProgress }) => {
    if (!softwareId || !version || !file) {
      throw new Error('Missing version upload parameters');
    }
    const payload = new FormData();
    payload.append('version', version);
    payload.append('release_notes', releaseNotes || '');
    payload.append('file', file);
    const response = await api.post(`/api/v1/software-management/${softwareId}/versions/upload`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  }, []);

  const updatePricing = useCallback(async ({ softwareId, priceCents, currency = 'USD' }) => {
    const response = await api.patch(`/api/v1/software-management/${softwareId}/pricing`, {
      price_cents: Number(priceCents || 0),
      currency,
    });
    return response.data;
  }, []);

  const createCheckout = useCallback(async (softwareId) => {
    const response = await api.post(`/api/v1/software-management/${softwareId}/checkout`);
    return response.data;
  }, []);

  const confirmCheckout = useCallback(async (paymentId) => {
    const response = await api.post(`/api/v1/software-management/payments/${paymentId}/confirm`);
    return response.data;
  }, []);

  const downloadVersion = useCallback(async ({ softwareId, version, fileName }) => {
    if (!softwareId || !version) throw new Error('Missing download parameters');
    const response = await api.get(`/api/v1/software-management/${softwareId}/versions/${version}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers?.['content-type'] || 'application/octet-stream',
    });
    const disposition = response.headers?.['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const resolvedName = match?.[1] || fileName || `${softwareId}-${version}.bin`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = resolvedName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { fileName: resolvedName };
  }, []);

  return {
    fetchSoftwareList,
    fetchSoftwareVersions,
    uploadSoftwareVersion,
    updateVersionState,
    updatePricing,
    createCheckout,
    confirmCheckout,
    downloadVersion,
  };
}
