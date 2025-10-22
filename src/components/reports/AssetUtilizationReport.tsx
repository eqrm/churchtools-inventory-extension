/**
 * AssetUtilizationReport Component (T203)
 * 
 * Displays asset utilization data including booking frequency,
 * usage hours, idle time, and utilization percentage.
 */

import { useState } from 'react';
import { Paper, Title, Group, Button, Select, Stack, Text, Loader } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { DataTable } from 'mantine-datatable';
import { IconDownload, IconFilter } from '@tabler/icons-react';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useAssets } from '../../hooks/useAssets';
import { useBookings } from '../../hooks/useBookings';
import { useCategories } from '../../hooks/useCategories';
import { calculateAssetUtilization, type AssetUtilizationData } from '../../utils/reportCalculations';
import { exportUtilizationToCSV } from '../../utils/exportCSV';

/**
 * Filter controls for utilization report
 */
function UtilizationFilters({
  dateRange,
  setDateRange,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  categories,
  locations,
}: {
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedLocation: string | null;
  setSelectedLocation: (location: string | null) => void;
  categories: Array<{ value: string; label: string }>;
  locations: string[];
}) {
  return (
    <Paper p="md" withBorder>
      <Group align="flex-end">
        <IconFilter size={20} />
        <Text fw={500}>Filter</Text>
      </Group>

      <Group mt="md">
        <DatePickerInput
          type="range"
          label="Zeitraum"
          placeholder="Zeitraum auswählen"
          value={dateRange}
          onChange={setDateRange}
          style={{ flex: 1 }}
        />

        <Select
          label="Kategorie"
          placeholder="Alle Kategorien"
          data={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          clearable
          style={{ flex: 1 }}
        />

        <Select
          label="Standort"
          placeholder="Alle Standorte"
          data={locations.map((loc) => ({ value: loc, label: loc }))}
          value={selectedLocation}
          onChange={setSelectedLocation}
          clearable
          style={{ flex: 1 }}
        />
      </Group>
    </Paper>
  );
}

/**
 * Utilization data table
 */
function UtilizationTable({ data }: { data: AssetUtilizationData[] }) {
  return (
    <DataTable
      withTableBorder
      withColumnBorders
      striped
      highlightOnHover
      records={data}
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
          width: 200,
        },
        {
          accessor: 'categoryName',
          title: 'Kategorie',
          width: 150,
        },
        {
          accessor: 'bookingCount',
          title: 'Buchungen',
          width: 120,
          textAlign: 'right',
        },
        {
          accessor: 'totalDaysBooked',
          title: 'Tage gebucht',
          width: 140,
          textAlign: 'right',
        },
        {
          accessor: 'utilizationPercentage',
          title: 'Auslastung',
          width: 130,
          textAlign: 'right',
          render: (row) => `${row.utilizationPercentage}%`,
        },
        {
          accessor: 'lastBookedDate',
          title: 'Letzte Buchung',
          width: 150,
          render: (row) =>
            row.lastBookedDate
              ? new Date(row.lastBookedDate).toLocaleDateString('de-DE')
              : '-',
        },
      ]}
      sortStatus={{
        columnAccessor: 'utilizationPercentage',
        direction: 'desc',
      }}
    />
  );
}

/**
 * AssetUtilizationReport Component
 */
export function AssetUtilizationReport() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    startOfMonth(subMonths(new Date(), 3)),
    endOfMonth(new Date()),
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings();
  const { data: categories } = useCategories();

  if (assetsLoading || bookingsLoading) return <Loader />;
  if (assetsError) return <Text c="red">Fehler beim Laden der Inventargegenstände</Text>;
  if (bookingsError) return <Text c="red">Fehler beim Laden der Buchungen</Text>;
  if (!assets || !bookings) return null;

  // Filter assets
  let filteredAssets = assets;
  if (selectedCategory) {
    filteredAssets = filteredAssets.filter((a) => a.category?.id === selectedCategory);
  }
  if (selectedLocation) {
    filteredAssets = filteredAssets.filter((a) => a.location === selectedLocation);
  }

  // Calculate utilization
  const utilizationData = calculateAssetUtilization(
    filteredAssets,
    bookings,
    dateRange[0] || new Date(),
    dateRange[1] || new Date()
  );

  // Extract unique locations
  const locations = Array.from(new Set(assets.map((a) => a.location).filter(Boolean))) as string[];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Inventar-Auslastung</Title>
        <Button
          leftSection={<IconDownload size={16} />}
          onClick={() => exportUtilizationToCSV(utilizationData)}
        >
          Exportieren
        </Button>
      </Group>

      <UtilizationFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        categories={categories?.map((c) => ({ value: c.id, label: c.name })) || []}
        locations={locations}
      />

      <UtilizationTable data={utilizationData} />
    </Stack>
  );
}
