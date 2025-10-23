/**
 * Custom Render Utility
 * 
 * Wraps components with necessary providers for testing.
 * Use this instead of @testing-library/react's render.
 */

import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    /**
     * Optional custom QueryClient for specific test scenarios
     */
    queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with all necessary providers
 */
export function customRender(
    ui: ReactElement,
    options?: CustomRenderOptions
) {
    const { queryClient = createTestQueryClient(), ...renderOptions } = options || {};

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <MantineProvider>
                    <Notifications />
                    {children}
                </MantineProvider>
            </QueryClientProvider>
        );
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create a test QueryClient with no retries and no caching
 */
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

// Re-export commonly used utilities from @testing-library/react
export { screen, waitFor, within, fireEvent } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override the default render with our custom render
export { customRender as render };
