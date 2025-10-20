import { Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import type { StockTakeSession } from '../../types/entities';

interface StockTakeReportProps {
  session: StockTakeSession;
}

/**
 * StockTakeReport component - Discrepancy report display (T156)
 */
/* eslint-disable max-lines-per-function */
export function StockTakeReport({ session }: StockTakeReportProps) {
  return (
    <Box>
      <Stack gap="md">
        <Title order={3}>Stock Take Report</Title>

        {/* Summary */}
        <Card withBorder>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text>Expected Assets:</Text>
              <Text fw={500}>{session.expectedAssets.length}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Scanned Assets:</Text>
              <Text fw={500} c="green">
                {session.scannedAssets.length}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>Missing Assets:</Text>
              <Text fw={500} c="red">
                {session.missingAssets?.length || 0}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>Unexpected Assets:</Text>
              <Text fw={500} c="orange">
                {session.unexpectedAssets?.length || 0}
              </Text>
            </Group>
          </Stack>
        </Card>

        {/* Missing Assets */}
        {session.missingAssets && session.missingAssets.length > 0 && (
          <Card withBorder>
            <Stack gap="sm">
              <Text fw={500}>Missing Assets</Text>
              <DataTable
                striped
                records={session.missingAssets}
                columns={[
                  { accessor: 'assetNumber', title: 'Asset Number' },
                  { accessor: 'name', title: 'Name' },
                  { accessor: 'lastKnownLocation', title: 'Last Known Location' },
                ]}
              />
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
