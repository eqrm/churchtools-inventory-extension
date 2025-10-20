import { Box, Card, Text } from '@mantine/core';

interface StockTakeScannerProps {
  sessionId: string;
}

/**
 * StockTakeScanner component - Full-screen scanning interface (T153)
 * Placeholder - will integrate BarcodeScanner in future iteration
 */
export function StockTakeScanner({ sessionId }: StockTakeScannerProps) {
  return (
    <Box>
      <Card>
        <Text>Stock Take Scanner for session {sessionId}</Text>
        <Text c="dimmed">Scanner integration pending</Text>
      </Card>
    </Box>
  );
}
