import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AssetFilters, ViewMode, ViewFilter } from '../types/entities';

/**
 * UI State Store (T213 - Enhanced with view preferences)
 * Manages global UI state (theme, sidebar, modals, filters, view preferences, etc.)
 */
interface UIState {
    // Sidebar
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    
    // Theme
    colorScheme: 'light' | 'dark' | 'auto';
    setColorScheme: (scheme: 'light' | 'dark' | 'auto') => void;
    
    // Modals
    activeModal: string | null;
    modalData: Record<string, unknown> | null;
    openModal: (modalId: string, data?: Record<string, unknown> | null) => void;
    closeModal: () => void;
    
    // Loading states
    globalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;
    
    // Asset Filters (User Story 1)
    assetFilters: AssetFilters;
    setAssetFilters: (filters: AssetFilters) => void;
    clearAssetFilters: () => void;
    updateAssetFilter: <K extends keyof AssetFilters>(key: K, value: AssetFilters[K]) => void;
    
    // View Preferences (T213 - Phase 11)
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    
    viewFilters: ViewFilter[];
    setViewFilters: (filters: ViewFilter[]) => void;
    clearViewFilters: () => void;
    
    sortBy: string | null;
    setSortBy: (field: string | null) => void;
    
    sortDirection: 'asc' | 'desc';
    setSortDirection: (direction: 'asc' | 'desc') => void;
    
    groupBy: string | null;
    setGroupBy: (field: string | null) => void;
    
    // Legacy view mode (kept for backward compatibility)
    assetViewMode: 'table' | 'gallery';
    setAssetViewMode: (mode: 'table' | 'gallery') => void;
    
    // Notifications
    showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Sidebar
            sidebarCollapsed: false,
            toggleSidebar: () => {
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
            },
            setSidebarCollapsed: (collapsed) => {
                set({ sidebarCollapsed: collapsed });
            },
            
            // Theme
            colorScheme: 'auto',
            setColorScheme: (scheme) => {
                set({ colorScheme: scheme });
            },
            
            // Modals
            activeModal: null,
            modalData: null,
            openModal: (modalId, data = null) => {
                set({ activeModal: modalId, modalData: data });
            },
            closeModal: () => {
                set({ activeModal: null, modalData: null });
            },
            
            // Loading states
            globalLoading: false,
            setGlobalLoading: (loading) => {
                set({ globalLoading: loading });
            },
            
            // Asset Filters
            assetFilters: {},
            setAssetFilters: (filters) => {
                set({ assetFilters: filters });
            },
            clearAssetFilters: () => {
                set({ assetFilters: {} });
            },
            updateAssetFilter: (key, value) => {
                set((state) => ({
                    assetFilters: { ...state.assetFilters, [key]: value },
                }));
            },
            
            // View Preferences (T213)
            viewMode: 'table',
            setViewMode: (mode) => {
                set({ viewMode: mode });
            },
            
            viewFilters: [],
            setViewFilters: (filters) => {
                set({ viewFilters: filters });
            },
            clearViewFilters: () => {
                set({ viewFilters: [] });
            },
            
            sortBy: null,
            setSortBy: (field) => {
                set({ sortBy: field });
            },
            
            sortDirection: 'asc',
            setSortDirection: (direction) => {
                set({ sortDirection: direction });
            },
            
            groupBy: null,
            setGroupBy: (field) => {
                set({ groupBy: field });
            },
            
            // Legacy view mode (kept for backward compatibility)
            assetViewMode: 'table',
            setAssetViewMode: (mode) => {
                set({ assetViewMode: mode });
            },
            
            // Notifications (placeholder - will use Mantine notifications)
            showNotification: () => {
                // Implementation will use Mantine's notifications in components
            },
        }),
        {
            name: 'churchtools-inventory-ui',
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                colorScheme: state.colorScheme,
                assetFilters: state.assetFilters,
                assetViewMode: state.assetViewMode,
                // T213: Persist view preferences
                viewMode: state.viewMode,
                viewFilters: state.viewFilters,
                sortBy: state.sortBy,
                sortDirection: state.sortDirection,
                groupBy: state.groupBy,
            }),
        }
    )
);

