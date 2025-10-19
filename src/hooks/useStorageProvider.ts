import { useEffect, useState } from 'react';
import type { IStorageProvider } from '../types/storage';
import { createStorageProvider } from '../services/storage/StorageProviderFactory';
import { churchToolsAPIClient } from '../services/api/ChurchToolsAPIClient';
import { churchtoolsClient } from '@churchtools/churchtools-client';

interface Module {
    id: number;
    shorty: string;
    name: string;
    description: string | null;
}

// Cache for module ID to avoid repeated API calls
let cachedModuleId: string | null = null;

/**
 * Fetch the custom module ID from ChurchTools by its key and cache it
 */
async function getModuleId(moduleKey: string): Promise<string> {
    // Return cached value if available
    if (cachedModuleId) {
        return cachedModuleId;
    }

    try {
        // Fetch the module by its key
        // The churchtoolsClient returns the data directly (not wrapped in { data: ... })
        const module = await churchtoolsClient.get<Module>(`/custommodules/${moduleKey}`);
        cachedModuleId = String(module.id);
        return cachedModuleId;
    } catch (apiError) {
        // If API call fails, try environment variable
        const envModuleId = import.meta.env['VITE_MODULE_ID'];
        if (envModuleId) {
            cachedModuleId = envModuleId;
            return cachedModuleId;
        }
        
        console.error('Could not fetch module via API and no VITE_MODULE_ID set:', apiError);
        throw new Error(
            'Unable to initialize storage: Custom module not found. ' +
            'Please create a custom module in ChurchTools admin panel with key "' + moduleKey + '" ' +
            'or set VITE_MODULE_ID in your .env file.'
        );
    }
}

/**
 * Hook to get the current storage provider instance
 * Creates and caches the provider based on environment configuration
 * Fetches or creates the custom module in ChurchTools on first use
 */
export function useStorageProvider(): IStorageProvider | null {
    const [provider, setProvider] = useState<IStorageProvider | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function initializeProvider() {
            try {
                const baseUrl = import.meta.env['VITE_BASE_URL'];
                const moduleKey = import.meta.env['VITE_KEY'] || 'fkoinventorymanagement';
                
                if (!baseUrl) {
                    throw new Error('VITE_BASE_URL not configured. Please set it in your .env file.');
                }

                const moduleId = await getModuleId(moduleKey);

                const storageProvider = createStorageProvider({
                    type: 'churchtools',
                    churchtools: {
                        moduleId,
                        baseUrl,
                        apiClient: churchToolsAPIClient,
                    },
                });

                setProvider(storageProvider);
                setIsLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
                setIsLoading(false);
            }
        }

        void initializeProvider();
    }, []);

    if (error) {
        throw error;
    }

    if (isLoading) {
        return null;
    }

    return provider;
}
