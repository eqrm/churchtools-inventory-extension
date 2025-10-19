import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStorageProvider } from './useStorageProvider';
import type { Asset, AssetCreate, AssetUpdate, AssetFilters } from '../types/entities';

/**
 * Query key factory for assets
 */
export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters?: AssetFilters) => [...assetKeys.lists(), { filters }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  byNumber: (assetNumber: string) => [...assetKeys.all, 'byNumber', assetNumber] as const,
};

/**
 * Hook to fetch assets with optional filtering
 */
export function useAssets(filters?: AssetFilters) {
  const provider = useStorageProvider();

  return useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: async () => {
      if (!provider) throw new Error('Storage provider not initialized');
      return await provider.getAssets(filters);
    },
    enabled: !!provider,
    staleTime: 2 * 60 * 1000, // 2 minutes (assets change more frequently than categories)
  });
}

/**
 * Hook to fetch a single asset by ID
 */
export function useAsset(id: string | undefined) {
  const provider = useStorageProvider();

  return useQuery({
    queryKey: assetKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!provider) throw new Error('Storage provider not initialized');
      if (!id) throw new Error('Asset ID is required');
      return await provider.getAsset(id);
    },
    enabled: !!provider && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch an asset by its asset number
 */
export function useAssetByNumber(assetNumber: string | undefined) {
  const provider = useStorageProvider();

  return useQuery({
    queryKey: assetKeys.byNumber(assetNumber ?? ''),
    queryFn: async () => {
      if (!provider) throw new Error('Storage provider not initialized');
      if (!assetNumber) throw new Error('Asset number is required');
      return await provider.getAssetByNumber(assetNumber);
    },
    enabled: !!provider && !!assetNumber,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create a new asset
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();
  const provider = useStorageProvider();

  return useMutation({
    mutationFn: async (data: AssetCreate) => {
      if (!provider) throw new Error('Storage provider not initialized');
      return await provider.createAsset(data);
    },
    onMutate: async (newAsset) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: assetKeys.lists() });

      // Snapshot previous value
      const previousAssets = queryClient.getQueryData(assetKeys.lists());

      // Optimistically update to show the new asset immediately
      queryClient.setQueryData<Asset[]>(assetKeys.lists(), (old) => {
        if (!old) return old;
        // Create temporary asset with optimistic data
        const tempAsset: Asset = {
          ...newAsset,
          id: `temp-${Date.now().toString()}`,
          createdBy: 'current-user',
          createdByName: 'Current User',
          createdAt: new Date().toISOString(),
          lastModifiedBy: 'current-user',
          lastModifiedByName: 'Current User',
          lastModifiedAt: new Date().toISOString(),
        } as Asset;
        return [...old, tempAsset];
      });

      return { previousAssets };
    },
    onError: (_err, _newAsset, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(assetKeys.lists(), context.previousAssets);
      }
    },
    onSuccess: (newAsset) => {
      // Invalidate all asset lists
      void queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      
      // Add to detail cache
      queryClient.setQueryData(assetKeys.detail(newAsset.id), newAsset);
      queryClient.setQueryData(assetKeys.byNumber(newAsset.assetNumber), newAsset);
    },
  });
}

/**
 * Hook to update an existing asset
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const provider = useStorageProvider();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssetUpdate }) => {
      if (!provider) throw new Error('Storage provider not initialized');
      return await provider.updateAsset(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: assetKeys.detail(id) });

      // Snapshot previous value
      const previousAsset = queryClient.getQueryData<Asset>(assetKeys.detail(id));

      // Optimistically update
      if (previousAsset) {
        queryClient.setQueryData<Asset>(assetKeys.detail(id), {
          ...previousAsset,
          ...data,
          lastModifiedAt: new Date().toISOString(),
        });
      }

      return { previousAsset };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousAsset) {
        queryClient.setQueryData(assetKeys.detail(id), context.previousAsset);
      }
    },
    onSuccess: (updatedAsset) => {
      // Update caches
      void queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.setQueryData(assetKeys.detail(updatedAsset.id), updatedAsset);
      queryClient.setQueryData(assetKeys.byNumber(updatedAsset.assetNumber), updatedAsset);
    },
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const provider = useStorageProvider();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!provider) throw new Error('Storage provider not initialized');
      await provider.deleteAsset(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from all caches
      queryClient.removeQueries({ queryKey: assetKeys.detail(deletedId) });
      void queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}
