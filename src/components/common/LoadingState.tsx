import { Center, Loader, Stack, Text } from '@mantine/core';

interface LoadingStateProps {
    message?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Loading State Component
 * Shows a loading spinner with optional message
 */
export function LoadingState({ message = 'Laden...', size = 'md' }: LoadingStateProps) {
    return (
        <Center h="100%" w="100%">
            <Stack align="center" gap="md">
                <Loader size={size} />
                {message && <Text c="dimmed">{message}</Text>}
            </Stack>
        </Center>
    );
}
