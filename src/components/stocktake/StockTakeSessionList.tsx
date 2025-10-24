import { Box, Button, Group, Stack, Title, Text } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { useStockTakeSessions } from '../../hooks/useStockTake';
import type { StockTakeSession, StockTakeStatus } from '../../types/entities';
import { formatDateOnly } from '../../utils/formatters';

interface StockTakeSessionListProps {
  onView?: (session: StockTakeSession) => void;
  initialStatus?: StockTakeStatus;
}

/**
 * StockTakeSessionList component - Display stock take sessions (T151)
 * Enhanced for E6: Removed duplicate New Stock Take button (T276)
 */
 
export function StockTakeSessionList({
  onView,
  initialStatus,
}: StockTakeSessionListProps) {
  const filters = initialStatus ? { status: initialStatus } : undefined;
  const { data: sessions = [], isLoading } = useStockTakeSessions(filters);

  return (
    <Box>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Stock Take Sessions</Title>
        </Group>

        <DataTable
          withTableBorder
          striped
          highlightOnHover
          records={sessions}
          onRowClick={({ record }) => {
            // Default action on row click: View session
            onView?.(record);
          }}
          rowStyle={() => ({ cursor: 'pointer' })}
          columns={[
            {
              accessor: 'startDate',
              title: 'Start Date',
              render: (session) => formatDateOnly(session.startDate),
            },
            {
              accessor: 'nameReason',
              title: 'Reason / Name',
              render: (session) => (
                <Text size="sm" lineClamp={2} c={session.nameReason ? undefined : 'dimmed'}>
                  {session.nameReason?.trim() || 'Not specified'}
                </Text>
              ),
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
                <Button 
                  size="xs" 
                  variant="subtle" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onView?.(session);
                  }}
                >
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
