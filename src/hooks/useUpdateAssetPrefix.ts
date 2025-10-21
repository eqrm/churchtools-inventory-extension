import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AssetPrefix, AssetPrefixUpdate } from '../types/entities';
import { useStorageProvider } from './useStorageProvider';

interface UpdateAssetPrefixParams {
  id: string;
  data: AssetPrefixUpdate;
}

/**
 * Hook to update an existing asset prefix
 */
export function useUpdateAssetPrefix() {
  const storageProvider = useStorageProvider();
  const queryClient = useQueryClient();

  return useMutation<AssetPrefix, Error, UpdateAssetPrefixParams>({
    mutationFn: async ({ id, data }: UpdateAssetPrefixParams) => {
      if (!storageProvider) {
        throw new Error('Storage provider not initialized');
      }
      return await storageProvider.updateAssetPrefix(id, data);
    },
    onSuccess: () => {
      // Invalidate and refetch asset prefixes
      void queryClient.invalidateQueries({ queryKey: ['assetPrefixes'] });
    },
  });
}
