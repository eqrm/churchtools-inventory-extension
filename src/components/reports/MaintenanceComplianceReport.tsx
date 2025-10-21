/**
 * MaintenanceComplianceReport Component (T204)
 * 
 * Displays maintenance compliance status: overdue vs compliant assets.
 */

import { Paper, Title, Group, Button, Stack, Text, Badge, Loader, SimpleGrid, RingProgress, Center } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { IconDownload } from '@tabler/icons-react';
import { useAssets } from '../../hooks/useAssets';
import { useMaintenanceSchedules } from '../../hooks/useMaintenance';
import { calculateMaintenanceCompliance } from '../../utils/reportCalculations';
import { exportMaintenanceComplianceToCSV } from '../../utils/exportCSV';

/**
 * Compliance statistics summary
 */
function ComplianceStats({ data }: { data: ReturnType<typeof calculateMaintenanceCompliance> }) {
  const percentage = data.compliancePercentage;
  const color = percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red';

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
      <Paper p="md" withBorder>
        <Center>
          <RingProgress
            size={120}
            thickness={12}
            sections={[{ value: percentage, color }]}
            label={
              <Center>
                <Text size="xl" fw={700}>{percentage.toFixed(1)}%</Text>
              </Center>
            }
          />
        </Center>
        <Text ta="center" mt="xs" fw={500}>Compliance-Rate</Text>
      </Paper>

      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center">{data.totalAssets}</Text>
        <Text ta="center" c="dimmed" size="sm">Inventargegenstände gesamt</Text>
      </Paper>

      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center" c="green">{data.compliantAssets}</Text>
        <Text ta="center" c="dimmed" size="sm">Konform</Text>
      </Paper>

      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center" c="red">{data.overdueAssets}</Text>
        <Text ta="center" c="dimmed" size="sm">Überfällig</Text>
      </Paper>

      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center" c="yellow">{data.upcomingAssets}</Text>
        <Text ta="center" c="dimmed" size="sm">Anstehend (30 Tage)</Text>
      </Paper>
    </SimpleGrid>
  );
}

/**
 * MaintenanceComplianceReport Component
 */
export function MaintenanceComplianceReport() {
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const { data: schedules, isLoading: schedulesLoading, error: schedulesError } = useMaintenanceSchedules();

  if (assetsLoading || schedulesLoading) return <Loader />;
  if (assetsError) return <Text c="red">Fehler beim Laden der Inventargegenstände</Text>;
  if (schedulesError) return <Text c="red">Fehler beim Laden der Wartungspläne</Text>;
  if (!assets || !schedules) return null;

  const complianceData = calculateMaintenanceCompliance(assets, schedules);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Wartungs-Compliance</Title>
        <Button
          leftSection={<IconDownload size={16} />}
          onClick={() => exportMaintenanceComplianceToCSV(complianceData)}
        >
          Exportieren
        </Button>
      </Group>

      <ComplianceStats data={complianceData} />

      <Title order={3} mt="md">Überfällige Wartungen</Title>

      <DataTable
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        records={complianceData.overdueList}
        columns={[
          {
            accessor: 'assetNumber',
            title: 'Inventarnummer',
            width: 150,
          },
          {
            accessor: 'assetName',
            title: 'Name',
            width: 200,
          },
          {
            accessor: 'scheduleName',
            title: 'Wartungstyp',
            width: 180,
          },
          {
            accessor: 'dueDate',
            title: 'Fällig am',
            width: 150,
            render: (row) => new Date(row.dueDate).toLocaleDateString('de-DE'),
          },
          {
            accessor: 'daysOverdue',
            title: 'Überfällig',
            width: 130,
            textAlign: 'right',
            render: (row) => (
              <Badge color="red" variant="filled">
                {row.daysOverdue} Tage
              </Badge>
            ),
          },
        ]}
        sortStatus={{
          columnAccessor: 'daysOverdue',
          direction: 'desc',
        }}
      />
    </Stack>
  );
}
