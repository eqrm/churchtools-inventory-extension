import { Group, Stack, Card, Text, Badge, ScrollArea } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { Asset, AssetStatus } from '../../types/entities';

interface AssetKanbanViewProps {
  assets: Asset[];
}

const statusGroups: { status: AssetStatus; label: string; color: string }[] = [
  { status: 'available', label: 'Verfügbar', color: 'green' },
  { status: 'in-use', label: 'In Benutzung', color: 'blue' },
  { status: 'in-repair', label: 'Wartung', color: 'yellow' },
  { status: 'broken', label: 'Defekt', color: 'red' },
  { status: 'sold', label: 'Verkauft', color: 'gray' },
  { status: 'destroyed', label: 'Zerstört', color: 'dark' },
];

/**
 * Kanban view displaying assets grouped by status
 */
export function AssetKanbanView({ assets }: AssetKanbanViewProps) {
  const groupedAssets = statusGroups.map((group) => ({
    ...group,
    assets: assets.filter((a) => a.status === group.status),
  }));

  return (
    <ScrollArea>
      <Group align="flex-start" gap="md" style={{ minWidth: 'fit-content' }}>
        {groupedAssets.map((group) => (
          <Stack
            key={group.status}
            gap="sm"
            style={{ minWidth: 280, maxWidth: 280 }}
          >
            <Group gap="xs">
              <Text fw={600}>{group.label}</Text>
              <Badge color={group.color} variant="filled" size="sm">
                {group.assets.length}
              </Badge>
            </Group>

            <Stack gap="xs">
              {group.assets.map((asset) => (
                <Card
                  key={asset.id}
                  component={Link}
                  to={`/assets/${asset.id}`}
                  shadow="sm"
                  padding="sm"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer', textDecoration: 'none' }}
                >
                  <Stack gap={4}>
                    <Text fw={500} size="sm" lineClamp={1}>
                      {asset.name}
                    </Text>
                    <Badge variant="light" size="xs">
                      {asset.assetNumber}
                    </Badge>
                    {asset.location && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        📍 {asset.location}
                      </Text>
                    )}
                  </Stack>
                </Card>
              ))}

              {group.assets.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="md">
                  Keine Assets
                </Text>
              )}
            </Stack>
          </Stack>
        ))}
      </Group>
    </ScrollArea>
  );
}
