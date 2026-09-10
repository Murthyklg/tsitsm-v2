import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import type { AssetRequest } from '../types/asset';

export const useAssetRequests = (userId?: string, isAdmin?: boolean) => {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  const refetch = () => setReloadIndex((value) => value + 1);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        if (!isAdmin && !userId) {
          setRequests([]);
          setLoading(false);
          return;
        }
        const requestsList = await apiRequest<AssetRequest[]>('/asset-requests');

        setRequests(requestsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userId, isAdmin, reloadIndex]);

  const createRequest = async (requestData: Omit<AssetRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await apiRequest('/asset-requests', { method: 'POST', body: JSON.stringify(requestData) });
      refetch();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create request');
    }
  };

  const addComment = async (requestId: string, comment: Omit<AssetRequest['comments'][0], 'id' | 'createdAt'>) => {
    try {
      await apiRequest(`/asset-requests/${requestId}/comments`, { method: 'POST', body: JSON.stringify(comment) });
      refetch();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add comment');
    }
  };

  const updateRequestStatus = async (requestId: string, status: AssetRequest['status'], adminNotes?: string) => {
    try {
      await apiRequest(`/asset-requests/${requestId}`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes }) });
      refetch();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update request');
    }
  };

  return { requests, loading, error, refetch, createRequest, addComment, updateRequestStatus };
};
