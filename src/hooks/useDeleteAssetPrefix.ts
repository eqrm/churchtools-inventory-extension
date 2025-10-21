import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStorageProvider } from './useStorageProvider';

/**
 * Hook to delete an asset prefix
 */
export function useDeleteAssetPrefix() {
  const storageProvider = useStorageProvider();
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (id: string) => {
      if (!storageProvider) {
        throw new Error('Storage provider not initialized');
      }
      await storageProvider.deleteAssetPrefix(id);
      return undefined;
    },
    onSuccess: () => {
      // Invalidate and refetch asset prefixes
      void queryClient.invalidateQueries({ queryKey: ['assetPrefixes'] });
    },
  });
}
