import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { theme } from './theme';
import App from './App';

// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import 'mantine-datatable/styles.css';

// Only import reset.css in development mode to keep the production bundle small
if (import.meta.env.MODE === 'development') {
    void import('./utils/reset.css');
}

declare const window: Window &
    typeof globalThis & {
        settings?: {
            base_url?: string;
        };
    };

// ChurchTools client setup
const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
if (!baseUrl) {
    throw new Error('ChurchTools base URL not configured. Please set VITE_BASE_URL in .env file.');
}
churchtoolsClient.setBaseUrl(baseUrl);

// Development authentication
const username = import.meta.env.VITE_USERNAME;
const password = import.meta.env.VITE_PASSWORD;
if (import.meta.env.MODE === 'development' && username && password) {
    await churchtoolsClient.post('/login', { username, password });
}

// TanStack Query client configuration
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache configuration for performance
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection time (formerly cacheTime)
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnMount: false, // Don't refetch on component mount if data is fresh
            retry: 1, // Retry failed requests once
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        },
        mutations: {
            retry: 0, // Don't retry mutations
        },
    },
});

// Render React app
const appElement = document.getElementById('app');
if (!appElement) {
    throw new Error('App element not found');
}

ReactDOM.createRoot(appElement).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
                <Notifications position="top-right" />
                <App />
                {import.meta.env.MODE === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
            </MantineProvider>
        </QueryClientProvider>
    </React.StrictMode>
);

