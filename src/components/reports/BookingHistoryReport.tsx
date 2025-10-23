/**
 * BookingHistoryReport Component (T206)
 * 
 * Displays booking trends over time and popular assets.
 */

import { useState } from 'react';
import { Paper, Title, Group, Button, Stack, Text, Loader, SimpleGrid } from '@mantine/core';
import DateRangeCalendar from '../common/DateRangeCalendar'
import { DataTable } from 'mantine-datatable';
import { IconDownload } from '@tabler/icons-react';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useAssets } from '../../hooks/useAssets';
import { useBookings } from '../../hooks/useBookings';
import { aggregateBookingHistory } from '../../utils/reportCalculations';
import { exportBookingHistoryToCSV } from '../../utils/exportCSV';

/**
 * Booking statistics summary
 */
function BookingStats({ data }: { data: ReturnType<typeof aggregateBookingHistory> }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center">{data.totalBookings}</Text>
        <Text ta="center" c="dimmed" size="sm">Buchungen gesamt</Text>
      </Paper>

      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center" c="blue">{data.activeBookings}</Text>
        <Text ta="center" c="dimmed" size="sm">Aktiv</Text>
      </Paper>

      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center" c="green">{data.completedBookings}</Text>
        <Text ta="center" c="dimmed" size="sm">Abgeschlossen</Text>
      </Paper>

      <Paper p="md" withBorder>
        <Text size="xl" fw={700} ta="center" c="red">{data.cancelledBookings}</Text>
        <Text ta="center" c="dimmed" size="sm">Storniert</Text>
      </Paper>
    </SimpleGrid>
  );
}

/**
 * BookingHistoryReport Component
 */
export function BookingHistoryReport() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    startOfMonth(subMonths(new Date(), 6)),
    endOfMonth(new Date()),
  ]);

  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings();

  if (assetsLoading || bookingsLoading) return <Loader />;
  if (assetsError) return <Text c="red">Fehler beim Laden der Inventargegenstände</Text>;
  if (bookingsError) return <Text c="red">Fehler beim Laden der Buchungen</Text>;
  if (!assets || !bookings) return null;

  const historyData = aggregateBookingHistory(
    bookings,
    assets,
    dateRange[0] || new Date(),
    dateRange[1] || new Date()
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Buchungsverlauf</Title>
        <Button
          leftSection={<IconDownload size={16} />}
          onClick={() => exportBookingHistoryToCSV(historyData)}
        >
          Exportieren
        </Button>
      </Group>

      <Paper p="md" withBorder>
        <Group>
          <Text fw={500}>Zeitraum:</Text>
          <div style={{ flex: 1, maxWidth: 400 }}>
            <DateRangeCalendar
              value={{ start: dateRange[0] ? dateRange[0].toISOString().split('T')[0] : undefined, end: dateRange[1] ? dateRange[1].toISOString().split('T')[0] : undefined }}
              onChange={(r) => {
                if (!r || !r.start || !r.end) {
                  setDateRange([null, null])
                  return
                }
                setDateRange([new Date(r.start), new Date(r.end)])
              }}
            />
          </div>
        </Group>
      </Paper>

      <BookingStats data={historyData} />

      <Title order={3} mt="md">Meist gebuchte Inventargegenstände</Title>

      <DataTable
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        records={historyData.mostBookedAssets}
        idAccessor="assetId"
        columns={[
          {
            accessor: 'assetNumber',
            title: 'Inventarnummer',
            width: 150,
          },
          {
            accessor: 'assetName',
            title: 'Name',
            width: 250,
          },
          {
            accessor: 'bookingCount',
            title: 'Anzahl Buchungen',
            width: 180,
            textAlign: 'right',
          },
        ]}
      />

      <Title order={3} mt="md">Buchungen pro Monat</Title>

      <DataTable
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        records={historyData.bookingsByMonth}
        idAccessor="month"
        columns={[
          {
            accessor: 'month',
            title: 'Monat',
            width: 150,
            render: (row) => {
              const parts = row.month.split('-');
              const year = parts[0] || '';
              const month = parts[1] || '';
              const date = new Date(parseInt(year), parseInt(month) - 1);
              return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
            },
          },
          {
            accessor: 'count',
            title: 'Anzahl Buchungen',
            width: 180,
            textAlign: 'right',
          },
        ]}
      />
    </Stack>
  );
}
