import { useQuery } from '@tanstack/react-query';
import { useStorageProvider } from './useStorageProvider';

/**
 * Query key factory for change history
 */
export const changeHistoryKeys = {
  all: ['changeHistory'] as const,
  lists: () => [...changeHistoryKeys.all, 'list'] as const,
  byAsset: (assetId: string) => [...changeHistoryKeys.lists(), 'asset', assetId] as const,
};

/**
 * Hook to fetch change history for a specific asset
 * @param assetId - Asset ID to fetch history for
 * @param limit - Optional limit on number of entries
 */
export function useChangeHistory(assetId: string | undefined, limit?: number) {
  const provider = useStorageProvider();

  return useQuery({
    queryKey: [...changeHistoryKeys.byAsset(assetId ?? ''), { limit }],
    queryFn: async () => {
      if (!provider) throw new Error('Storage provider not initialized');
      if (!assetId) throw new Error('Asset ID is required');
      return await provider.getChangeHistory('asset', assetId, limit);
    },
    enabled: !!provider && !!assetId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
