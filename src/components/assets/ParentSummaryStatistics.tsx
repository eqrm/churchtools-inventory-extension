/**
 * T104 - US4: Parent Summary Statistics Component
 * Displays detailed statistics about parent asset's children
 */
import { Card, Group, Progress, Stack, Text, Title } from '@mantine/core';
import { IconCheck, IconAlertCircle, IconClock } from '@tabler/icons-react';
import type { Asset } from '../../types/entities';

interface ParentSummaryStatisticsProps {
  childAssets: Asset[];
}

interface Statistics {
  totalCount: number;
  availableCount: number;
  inUseCount: number;
  brokenCount: number;
  installedCount: number;
  inRepairCount: number;
  availablePercent: number;
  inUsePercent: number;
  issuesPercent: number;
  topLocations: [string, number][];
}

function calculateStatistics(childAssets: Asset[]): Statistics {
  const totalCount = childAssets.length;
  const availableCount = childAssets.filter((a) => a.status === 'available').length;
  const inUseCount = childAssets.filter((a) => a.status === 'in-use').length;
  const brokenCount = childAssets.filter((a) => a.status === 'broken').length;
  const installedCount = childAssets.filter((a) => a.status === 'installed').length;
  const inRepairCount = childAssets.filter((a) => a.status === 'in-repair').length;

  const locationCounts = childAssets.reduce((acc, asset) => {
    const loc = asset.location || 'Unspecified';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLocations = Object.entries(locationCounts).sort(([, a], [, b]) => b - a).slice(0, 3);

  return {
    totalCount,
    availableCount,
    inUseCount,
    brokenCount,
    installedCount,
    inRepairCount,
    availablePercent: (availableCount / totalCount) * 100,
    inUsePercent: (inUseCount / totalCount) * 100,
    issuesPercent: ((brokenCount + inRepairCount) / totalCount) * 100,
    topLocations,
  };
}

function AvailabilityProgress({ stats }: { stats: Statistics }) {
  return (
    <div>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>Availability</Text>
        <Text size="sm" c="dimmed">{stats.availableCount} of {stats.totalCount} available</Text>
      </Group>
      <Progress.Root size="xl">
        <Progress.Section value={stats.availablePercent} color="green">
          <Progress.Label>{stats.availableCount}</Progress.Label>
        </Progress.Section>
        <Progress.Section value={stats.inUsePercent} color="blue">
          <Progress.Label>{stats.inUseCount}</Progress.Label>
        </Progress.Section>
        <Progress.Section value={stats.issuesPercent} color="red">
          <Progress.Label>{stats.brokenCount + stats.inRepairCount}</Progress.Label>
        </Progress.Section>
      </Progress.Root>
    </div>
  );
}

function StatusBreakdown({ stats }: { stats: Statistics }) {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>Status Breakdown</Text>
      <Group gap="xl">
        <Group gap="xs">
          <IconCheck size={16} color="var(--mantine-color-green-6)" />
          <Text size="sm">{stats.availableCount} Available</Text>
        </Group>
        <Group gap="xs">
          <IconClock size={16} color="var(--mantine-color-blue-6)" />
          <Text size="sm">{stats.inUseCount} In Use</Text>
        </Group>
        {(stats.brokenCount > 0 || stats.inRepairCount > 0) && (
          <Group gap="xs">
            <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
            <Text size="sm">{stats.brokenCount + stats.inRepairCount} Issues</Text>
          </Group>
        )}
        {stats.installedCount > 0 && <Text size="sm" c="dimmed">{stats.installedCount} Installed</Text>}
      </Group>
    </Stack>
  );
}

export function ParentSummaryStatistics({ childAssets }: ParentSummaryStatisticsProps) {
  if (childAssets.length === 0) return null;

  const stats = calculateStatistics(childAssets);

  return (
    <Card withBorder>
      <Stack gap="md">
        <Title order={5}>Summary Statistics</Title>
        <AvailabilityProgress stats={stats} />
        <StatusBreakdown stats={stats} />
        {stats.topLocations.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>Top Locations</Text>
            {stats.topLocations.map(([location, count]) => (
              <Group key={location} justify="space-between">
                <Text size="sm">{location}</Text>
                <Text size="sm" c="dimmed">{count} units</Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
