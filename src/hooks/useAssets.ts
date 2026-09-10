import { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import type { Asset } from '../types/asset';

export const useAssets = (userId?: string, isAdmin?: boolean, userEmail?: string | null) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  const refetch = () => setReloadIndex((value) => value + 1);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const assetsList = await apiRequest<Asset[]>('/assets');
        setAssets(assetsList.map((asset) => ({ ...asset, purchaseDate: new Date(asset.purchaseDate), warrantyExpiration: new Date(asset.warrantyExpiration), createdAt: new Date(asset.createdAt), updatedAt: new Date(asset.updatedAt) })));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [userId, userEmail, isAdmin, reloadIndex]);

  return { assets, loading, error, refetch };
};
