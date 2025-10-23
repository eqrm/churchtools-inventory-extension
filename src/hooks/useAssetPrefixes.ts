import { useQuery } from '@tanstack/react-query';
import type { AssetPrefix } from '../types/entities';
import { useStorageProvider } from './useStorageProvider';

/**
 * Hook to fetch all asset prefixes
 */
export function useAssetPrefixes() {
  const storageProvider = useStorageProvider();

  return useQuery<AssetPrefix[], Error>({
    queryKey: ['assetPrefixes'],
    queryFn: async () => {
      if (!storageProvider) {
        throw new Error('Storage provider not initialized');
      }
      return await storageProvider.getAssetPrefixes();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!storageProvider,
  });
}
