import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

/**
 * Error State Component
 * Shows an error message with optional retry button
 */
export function ErrorState({ 
    title = 'Fehler',
    message,
    onRetry,
}: ErrorStateProps) {
    return (
        <Stack gap="md" p="md">
            <Alert
                icon={<IconAlertCircle size={16} />}
                title={title}
                color="red"
                variant="light"
            >
                <Text size="sm">{message}</Text>
            </Alert>
            {onRetry && (
                <Button
                    leftSection={<IconRefresh size={16} />}
                    onClick={onRetry}
                    variant="light"
                >
                    Erneut versuchen
                </Button>
            )}
        </Stack>
    );
}
