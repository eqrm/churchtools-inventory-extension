import { Box, Group, Progress, Stack, Text } from '@mantine/core';
import type { StockTakeSession } from '../../types/entities';

interface StockTakeProgressProps {
  session: StockTakeSession;
}

/**
 * StockTakeProgress component - Progress bar showing scanned/total (T155)
 */
export function StockTakeProgress({ session }: StockTakeProgressProps) {
  const progress =
    session.expectedAssets.length > 0
      ? Math.round((session.scannedAssets.length / session.expectedAssets.length) * 100)
      : 0;

  return (
    <Box>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={500}>Progress</Text>
          <Text>
            {session.scannedAssets.length} / {session.expectedAssets.length}
          </Text>
        </Group>
        <Progress value={progress} size="lg" />
        <Text size="sm" c="dimmed">
          {String(progress)}% complete
        </Text>
      </Stack>
    </Box>
  );
}
