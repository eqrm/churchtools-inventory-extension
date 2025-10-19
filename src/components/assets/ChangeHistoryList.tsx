/* eslint-disable max-lines-per-function */
import { Card, Stack, Text, Title } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { useChangeHistory } from '../../hooks/useChangeHistory';
import type { ChangeHistoryEntry } from '../../types/entities';

interface ChangeHistoryListProps {
  entityType: 'asset' | 'category' | 'booking' | 'kit' | 'maintenance' | 'stocktake';
  entityId: string;
  limit?: number;
  title?: string;
}

export function ChangeHistoryList({
  entityType,
  entityId,
  limit = 50,
  title = 'Change History',
}: ChangeHistoryListProps) {
  const { data: history = [], isLoading, error } = useChangeHistory(entityId, limit);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'green';
      case 'updated':
      case 'status-changed':
        return 'blue';
      case 'deleted':
        return 'red';
      case 'booked':
      case 'checked-out':
        return 'cyan';
      case 'checked-in':
        return 'teal';
      case 'maintenance-performed':
        return 'orange';
      case 'scanned':
        return 'violet';
      default:
        return 'gray';
    }
  };

  if (error) {
    return (
      <Card withBorder>
        <Text c="red">Error loading change history: {error.message}</Text>
      </Card>
    );
  }

  if (!isLoading && history.length === 0) {
    return (
      <Card withBorder>
        <Stack gap="xs">
          <Title order={4}>{title}</Title>
          <Text size="sm" c="dimmed">
            No change history available for this {entityType}.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        <Title order={4}>{title}</Title>
        
        <DataTable
          withTableBorder
          borderRadius="sm"
          striped
          highlightOnHover
          records={history}
          columns={[
            {
              accessor: 'changedAt',
              title: 'Date & Time',
              width: 160,
              render: (entry: ChangeHistoryEntry) => (
                <Text size="xs">{formatDate(entry.changedAt)}</Text>
              ),
            },
            {
              accessor: 'changedByName',
              title: 'User',
              width: 150,
              render: (entry: ChangeHistoryEntry) => (
                <Text size="sm">{entry.changedByName}</Text>
              ),
            },
            {
              accessor: 'action',
              title: 'Action',
              width: 140,
              render: (entry: ChangeHistoryEntry) => (
                <Text
                  size="sm"
                  fw={600}
                  c={getActionColor(entry.action)}
                  tt="capitalize"
                >
                  {entry.action.replace(/-/g, ' ')}
                </Text>
              ),
            },
            {
              accessor: 'fieldName',
              title: 'Field',
              width: 120,
              render: (entry: ChangeHistoryEntry) => (
                <Text size="sm">{entry.fieldName || '—'}</Text>
              ),
            },
            {
              accessor: 'oldValue',
              title: 'Old Value',
              render: (entry: ChangeHistoryEntry) => (
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {entry.oldValue || '—'}
                </Text>
              ),
            },
            {
              accessor: 'newValue',
              title: 'New Value',
              render: (entry: ChangeHistoryEntry) => (
                <Text size="xs" lineClamp={2}>
                  {entry.newValue || '—'}
                </Text>
              ),
            },
          ]}
          fetching={isLoading}
          minHeight={150}
          noRecordsText={`No change history found for this ${entityType}`}
        />
      </Stack>
    </Card>
  );
}
