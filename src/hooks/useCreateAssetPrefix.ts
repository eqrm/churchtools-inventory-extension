import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AssetPrefix, AssetPrefixCreate } from '../types/entities';
import { useStorageProvider } from './useStorageProvider';

/**
 * Hook to create a new asset prefix
 */
export function useCreateAssetPrefix() {
  const storageProvider = useStorageProvider();
  const queryClient = useQueryClient();

  return useMutation<AssetPrefix, Error, AssetPrefixCreate>({
    mutationFn: async (data: AssetPrefixCreate) => {
      if (!storageProvider) {
        throw new Error('Storage provider not initialized');
      }
      return await storageProvider.createAssetPrefix(data);
    },
    onSuccess: () => {
      // Invalidate and refetch asset prefixes
      void queryClient.invalidateQueries({ queryKey: ['assetPrefixes'] });
    },
  });
}
