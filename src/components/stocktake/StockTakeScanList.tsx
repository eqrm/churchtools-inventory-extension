import { Box, Card, Stack, Text } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import type { StockTakeSession } from '../../types/entities';
import { formatDateTime } from '../../utils/formatters';

interface StockTakeScanListProps {
  session: StockTakeSession;
}

/**
 * StockTakeScanList component - Real-time list of scanned assets (T154)
 */
export function StockTakeScanList({ session }: StockTakeScanListProps) {
  return (
    <Box>
      <Stack gap="md">
        <Text fw={500}>Scanned Assets</Text>
        <Card withBorder>
          <DataTable
            striped
            records={session.scannedAssets}
            columns={[
              { accessor: 'assetNumber', title: 'Asset Number' },
              { accessor: 'scannedByName', title: 'Scanned By' },
              {
                accessor: 'scannedAt',
                title: 'Scanned At',
                render: (scan) => formatDateTime(scan.scannedAt),
              },
            ]}
            noRecordsText="No assets scanned yet"
          />
        </Card>
      </Stack>
    </Box>
  );
}
