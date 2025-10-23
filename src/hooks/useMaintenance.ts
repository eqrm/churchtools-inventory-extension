/**
 * TanStack Query hooks for maintenance management (T167)
 * 
 * Provides React hooks for CRUD operations on maintenance records and schedules
 * with automatic caching, refetching, and optimistic updates.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStorageProvider } from './useStorageProvider';
import type {
    MaintenanceRecord,
    MaintenanceRecordCreate,
    MaintenanceSchedule,
    MaintenanceScheduleCreate,
    UUID,
} from '../types/entities';

/**
 * Query key factory for maintenance operations
 */
export const maintenanceKeys = {
    all: ['maintenance'] as const,
    records: () => [...maintenanceKeys.all, 'records'] as const,
    recordsByAsset: (assetId: string) => [...maintenanceKeys.records(), { assetId }] as const,
    record: (id: string) => [...maintenanceKeys.all, 'record', id] as const,
    schedules: () => [...maintenanceKeys.all, 'schedules'] as const,
    schedulesByAsset: (assetId: string) => [...maintenanceKeys.schedules(), { assetId }] as const,
    schedule: (id: string) => [...maintenanceKeys.all, 'schedule', id] as const,
    overdue: () => [...maintenanceKeys.all, 'overdue'] as const,
};

/**
 * Hook to fetch maintenance records
 * 
 * @param assetId - Optional asset ID to filter records
 * @returns Query result with array of maintenance records
 */
export function useMaintenanceRecords(assetId?: UUID) {
    const storage = useStorageProvider();

    return useQuery({
        queryKey: assetId ? maintenanceKeys.recordsByAsset(assetId) : maintenanceKeys.records(),
        queryFn: async () => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            return await storage.getMaintenanceRecords(assetId);
        },
        enabled: !!storage,
    });
}

/**
 * Hook to fetch a single maintenance record
 */
export function useMaintenanceRecord(id: UUID | undefined) {
    const storage = useStorageProvider();

    return useQuery({
        queryKey: id ? maintenanceKeys.record(id) : ['maintenance', 'record', 'none'],
        queryFn: async () => {
            if (!storage || !id) {
                throw new Error('Storage provider or ID not available');
            }
            return await storage.getMaintenanceRecord(id);
        },
        enabled: !!storage && !!id,
    });
}

/**
 * Hook to fetch maintenance schedules
 * 
 * @param assetId - Optional asset ID to filter schedules
 * @returns Query result with array of maintenance schedules
 */
export function useMaintenanceSchedules(assetId?: UUID) {
    const storage = useStorageProvider();

    return useQuery({
        queryKey: assetId ? maintenanceKeys.schedulesByAsset(assetId) : maintenanceKeys.schedules(),
        queryFn: async () => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            return await storage.getMaintenanceSchedules(assetId);
        },
        enabled: !!storage,
    });
}

/**
 * Hook to fetch a single maintenance schedule
 */
export function useMaintenanceSchedule(id: UUID | undefined) {
    const storage = useStorageProvider();

    return useQuery({
        queryKey: id ? maintenanceKeys.schedule(id) : ['maintenance', 'schedule', 'none'],
        queryFn: async () => {
            if (!storage || !id) {
                throw new Error('Storage provider or ID not available');
            }
            return await storage.getMaintenanceSchedule(id);
        },
        enabled: !!storage && !!id,
    });
}

/**
 * Hook to create a maintenance record
 */
export function useCreateMaintenanceRecord() {
    const storage = useStorageProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: MaintenanceRecordCreate) => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            return await storage.createMaintenanceRecord(data);
        },
        onSuccess: (record: MaintenanceRecord) => {
            void queryClient.invalidateQueries({ queryKey: maintenanceKeys.records() });
            void queryClient.invalidateQueries({
                queryKey: maintenanceKeys.recordsByAsset(record.asset.id),
            });
        },
    });
}

/**
 * Hook to update a maintenance record
 */
export function useUpdateMaintenanceRecord() {
    const storage = useStorageProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { id: UUID; data: Partial<MaintenanceRecord> }) => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            return await storage.updateMaintenanceRecord(params.id, params.data);
        },
        onSuccess: (record: MaintenanceRecord) => {
            void queryClient.invalidateQueries({ queryKey: maintenanceKeys.records() });
            void queryClient.invalidateQueries({ queryKey: maintenanceKeys.record(record.id) });
        },
    });
}

/**
 * Hook to create a maintenance schedule
 */
export function useCreateMaintenanceSchedule() {
    const storage = useStorageProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: MaintenanceScheduleCreate) => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            return await storage.createMaintenanceSchedule(data);
        },
        onSuccess: (schedule: MaintenanceSchedule) => {
            void queryClient.invalidateQueries({ queryKey: maintenanceKeys.schedules() });
            void queryClient.invalidateQueries({
                queryKey: maintenanceKeys.schedulesByAsset(schedule.assetId),
            });
        },
    });
}

/**
 * Hook to update a maintenance schedule
 */
export function useUpdateMaintenanceSchedule() {
    const storage = useStorageProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { id: UUID; data: Partial<MaintenanceSchedule> }) => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            return await storage.updateMaintenanceSchedule(params.id, params.data);
        },
        onSuccess: (schedule: MaintenanceSchedule) => {
            void queryClient.invalidateQueries({ queryKey: maintenanceKeys.schedules() });
            void queryClient.invalidateQueries({ queryKey: maintenanceKeys.schedule(schedule.id) });
        },
    });
}

/**
 * Hook to delete a maintenance schedule
 */
export function useDeleteMaintenanceSchedule() {
    const storage = useStorageProvider();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: UUID) => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            await storage.deleteMaintenanceSchedule(id);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: maintenanceKeys.schedules() });
        },
    });
}

/**
 * Hook to fetch overdue maintenance items
 */
export function useOverdueMaintenance() {
    const storage = useStorageProvider();

    return useQuery({
        queryKey: maintenanceKeys.overdue(),
        queryFn: async () => {
            if (!storage) {
                throw new Error('Storage provider not available');
            }
            return await storage.getOverdueMaintenanceSchedules();
        },
        enabled: !!storage,
        refetchInterval: 60000, // Refresh every minute
    });
}
