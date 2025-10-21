/**
 * TanStack Query hooks for Equipment Kits
 * Provides data fetching and mutation hooks for kit CRUD operations
 * 
 * @module hooks/useKits
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStorageProvider } from './useStorageProvider';
import type { KitCreate, KitUpdate } from '../types/entities';

/**
 * Query key factory for kits
 */
export const kitKeys = {
  all: ['kits'] as const,
  lists: () => [...kitKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...kitKeys.lists(), filters] as const,
  details: () => [...kitKeys.all, 'detail'] as const,
  detail: (id: string) => [...kitKeys.details(), id] as const,
  availability: (id: string, startDate: string, endDate: string) =>
    [...kitKeys.detail(id), 'availability', startDate, endDate] as const,
};

/**
 * Hook to fetch all kits
 * @returns Query result with array of kits
 */
export function useKits() {
  const storage = useStorageProvider();

  return useQuery({
    queryKey: kitKeys.lists(),
    queryFn: () => {
      if (!storage) throw new Error('Storage provider not available');
      return storage.getKits();
    },
  });
}

/**
 * Hook to fetch a single kit by ID
 * @param id - Kit ID
 * @returns Query result with kit or null
 */
export function useKit(id: string) {
  const storage = useStorageProvider();

  return useQuery({
    queryKey: kitKeys.detail(id),
    queryFn: () => {
      if (!storage) throw new Error('Storage provider not available');
      return storage.getKit(id);
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook to check kit availability for a date range
 * @param kitId - Kit ID
 * @param startDate - Start date (ISO 8601)
 * @param endDate - End date (ISO 8601)
 * @returns Query result with availability information
 */
export function useKitAvailability(
  kitId: string,
  startDate: string,
  endDate: string
) {
  const storage = useStorageProvider();

  return useQuery({
    queryKey: kitKeys.availability(kitId, startDate, endDate),
    queryFn: () => {
      if (!storage) throw new Error('Storage provider not available');
      return storage.isKitAvailable(kitId, startDate, endDate);
    },
    enabled: Boolean(kitId && startDate && endDate),
  });
}

/**
 * Hook to create a new kit
 * Invalidates kit list cache on success
 * @returns Mutation object for creating kits
 */
export function useCreateKit() {
  const storage = useStorageProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: KitCreate) => {
      if (!storage) throw new Error('Storage provider not available');
      return storage.createKit(data);
    },
    onSuccess: (newKit) => {
      // Invalidate and refetch kit lists
      queryClient.invalidateQueries({ queryKey: kitKeys.lists() });
      // Set the new kit in cache
      queryClient.setQueryData(kitKeys.detail(newKit.id), newKit);
    },
  });
}

/**
 * Hook to update an existing kit
 * Invalidates kit cache on success
 * @returns Mutation object for updating kits
 */
export function useUpdateKit() {
  const storage = useStorageProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KitUpdate }) => {
      if (!storage) throw new Error('Storage provider not available');
      return storage.updateKit(id, data);
    },
    onSuccess: (updatedKit) => {
      // Update the kit in cache
      queryClient.setQueryData(kitKeys.detail(updatedKit.id), updatedKit);
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: kitKeys.lists() });
    },
  });
}

/**
 * Hook to delete a kit
 * Invalidates kit cache on success
 * @returns Mutation object for deleting kits
 */
export function useDeleteKit() {
  const storage = useStorageProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!storage) throw new Error('Storage provider not available');
      return storage.deleteKit(id);
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: kitKeys.detail(id) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: kitKeys.lists() });
    },
  });
}
