/* eslint-disable max-lines-per-function */
import { Badge, Card, Group, Stack, Text, Timeline, Title } from '@mantine/core';
import { useChangeHistory } from '../../hooks/useChangeHistory';
import { formatChangeEntry, getActionColor } from '../../utils/historyFormatters';
import { formatFieldName } from '../../utils/historyFormatters';
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
        
        {isLoading ? (
          <Text size="sm" c="dimmed">Loading history...</Text>
        ) : (
          <Timeline active={history.length} bulletSize={24} lineWidth={2}>
            {history.map((entry: ChangeHistoryEntry) => {
              const formatted = formatChangeEntry(entry);
              
              return (
                <Timeline.Item
                  key={entry.id}
                  color={getActionColor(entry.action)}
                  title={
                    <Group gap="xs">
                      <Badge size="sm" variant="light" color="gray">
                        {formatted.date}
                      </Badge>
                      <Text size="sm">{formatted.text}</Text>
                    </Group>
                  }
                >
                  {/* Show only the changed values, not what stayed the same */}
                  {formatted.changes && formatted.changes.length > 0 && (
                    <Stack gap="xs" mt="xs">
                      {formatted.changes.map((change, idx) => (
                        <Group key={idx} gap="xs" wrap="nowrap">
                          <Text size="xs" c="dimmed" style={{ minWidth: '80px' }}>
                            {formatFieldName(change.field)}:
                          </Text>
                          <Badge size="sm" color="red" variant="light">
                            {change.oldValue || '(empty)'}
                          </Badge>
                          <Text size="xs" c="dimmed">→</Text>
                          <Badge size="sm" color="green" variant="light">
                            {change.newValue || '(empty)'}
                          </Badge>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Stack>
    </Card>
  );
}
