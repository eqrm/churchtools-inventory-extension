import { useQuery } from '@tanstack/react-query';
import type { PersonInfo } from '../types/entities';
import { churchToolsAPIClient } from '../services/api/ChurchToolsAPIClient';

/**
 * Hook to get current user information
 * Uses TanStack Query for caching
 */
export function useCurrentUser() {
    return useQuery<PersonInfo>({
        queryKey: ['currentUser'],
        queryFn: async () => {
            return await churchToolsAPIClient.getCurrentUser();
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
    });
}
