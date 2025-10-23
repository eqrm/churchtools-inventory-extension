import { Box, Card, Text, Stack } from '@mantine/core';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncProgressIndicator } from './SyncProgressIndicator';
import { useSyncService } from '../../hooks/useSyncService';

interface StockTakeScannerProps {
  sessionId: string;
}

/**
 * StockTakeScanner component - Full-screen scanning interface (T153)
 * With offline support (T163) and sync progress (T166)
 */
export function StockTakeScanner({ sessionId }: StockTakeScannerProps) {
  const isOnline = useOnlineStatus();
  const { hasPending, syncProgress } = useSyncService();

  return (
    <Box>
      <Stack gap="md">
        {/* Offline indicator banner (T163) */}
        {!isOnline && (
          <OfflineIndicator pendingSyncs={syncProgress.total} />
        )}

        {/* Sync progress indicator (T166) */}
        {hasPending && <SyncProgressIndicator />}

        <Card>
          <Text>Stock Take Scanner for session {sessionId}</Text>
          <Text c="dimmed">Scanner integration pending</Text>
          <Text c="dimmed" size="xs" mt="md">
            Status: {isOnline ? 'Online' : 'Offline'}
          </Text>
        </Card>
      </Stack>
    </Box>
  );
}
