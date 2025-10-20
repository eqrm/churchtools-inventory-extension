import { Box, Button, Group, Stack, Title } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { IconPlus } from '@tabler/icons-react';
import { useStockTakeSessions } from '../../hooks/useStockTake';
import type { StockTakeSession, StockTakeStatus } from '../../types/entities';
import { formatDateOnly } from '../../utils/formatters';

interface StockTakeSessionListProps {
  onView?: (session: StockTakeSession) => void;
  onCreateNew?: () => void;
  initialStatus?: StockTakeStatus;
}

/**
 * StockTakeSessionList component - Display stock take sessions (T151)
 * Minimal implementation for task completion
 */
/* eslint-disable max-lines-per-function */
export function StockTakeSessionList({
  onView,
  onCreateNew,
  initialStatus,
}: StockTakeSessionListProps) {
  const filters = initialStatus ? { status: initialStatus } : undefined;
  const { data: sessions = [], isLoading } = useStockTakeSessions(filters);

  return (
    <Box>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Stock Take Sessions</Title>
          {onCreateNew && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateNew}>
              New Stock Take
            </Button>
          )}
        </Group>

        <DataTable
          withTableBorder
          striped
          highlightOnHover
          records={sessions}
          columns={[
            {
              accessor: 'startDate',
              title: 'Start Date',
              render: (session) => formatDateOnly(session.startDate),
            },
            {
              accessor: 'status',
              title: 'Status',
            },
            {
              accessor: 'conductedByName',
              title: 'Conducted By',
            },
            {
              accessor: 'actions',
              title: '',
              render: (session) => (
                <Button size="xs" variant="subtle" onClick={() => onView?.(session)}>
                  View
                </Button>
              ),
            },
          ]}
          fetching={isLoading}
          minHeight={200}
          noRecordsText="No stock take sessions found"
        />
      </Stack>
    </Box>
  );
}
