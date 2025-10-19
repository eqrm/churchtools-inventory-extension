import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStorageProvider } from './useStorageProvider';
import type { CategoryCreate, CategoryUpdate } from '../types/entities';

/**
 * Query key factory for categories
 */
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

/**
 * Hook to fetch all asset categories
 */
export function useCategories() {
  const provider = useStorageProvider();

  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async () => {
      if (!provider) throw new Error('Storage provider not initialized');
      return await provider.getCategories();
    },
    enabled: !!provider,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(id: string | undefined) {
  const provider = useStorageProvider();

  return useQuery({
    queryKey: categoryKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!provider) throw new Error('Storage provider not initialized');
      if (!id) throw new Error('Category ID is required');
      return await provider.getCategory(id);
    },
    enabled: !!provider && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const provider = useStorageProvider();

  return useMutation({
    mutationFn: async (data: CategoryCreate) => {
      if (!provider) throw new Error('Storage provider not initialized');
      return await provider.createCategory(data);
    },
    onSuccess: (newCategory) => {
      // Invalidate category lists to refetch
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      
      // Optimistically add to cache
      queryClient.setQueryData(categoryKeys.detail(newCategory.id), newCategory);
    },
  });
}

/**
 * Hook to update an existing category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const provider = useStorageProvider();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryUpdate }) => {
      if (!provider) throw new Error('Storage provider not initialized');
      return await provider.updateCategory(id, data);
    },
    onSuccess: (updatedCategory) => {
      // Invalidate both list and detail queries
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.setQueryData(categoryKeys.detail(updatedCategory.id), updatedCategory);
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const provider = useStorageProvider();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!provider) throw new Error('Storage provider not initialized');
      await provider.deleteCategory(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: categoryKeys.detail(deletedId) });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}
