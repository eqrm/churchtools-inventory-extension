/**
 * MaintenanceRecordsSection component (T172 UI integration)
 * Displays maintenance history with filtering and quick access to logging
 */

import { useEffect, useMemo, useState } from 'react';
import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { IconFilter, IconPlus, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ListLoadingSkeleton } from '../common/ListLoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { MaintenanceRecordList } from './MaintenanceRecordList';
import { useMaintenanceRecords } from '../../hooks/useMaintenance';
import type { Asset, MaintenanceRecord } from '../../types/entities';

interface MaintenanceRecordsSectionProps {
  assets?: Asset[];
  assetsLoading?: boolean;
  onCreateRecord: (asset?: Asset) => void;
}

const maintenanceTypeOptions = [
  { value: 'all', label: 'Alle Typen' },
  { value: 'inspection', label: 'Inspektion' },
  { value: 'cleaning', label: 'Reinigung' },
  { value: 'repair', label: 'Reparatur' },
  { value: 'calibration', label: 'Kalibrierung' },
  { value: 'testing', label: 'Prüfung' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Sonstiges' },
];

export function MaintenanceRecordsSection({ assets, assetsLoading, onCreateRecord }: MaintenanceRecordsSectionProps) {
  const { data: records, isLoading, error } = useMaintenanceRecords();
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const assetMap = useMemo(() => {
    if (!assets) return new Map<string, Asset>();
    return new Map(assets.map((asset) => [asset.id, asset]));
  }, [assets]);

  const filteredRecords: MaintenanceRecord[] = useMemo(() => {
    if (!records) return [];

    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return sorted.filter((record) => {
      if (assetFilter !== 'all' && record.asset.id !== assetFilter) {
        return false;
      }

      if (typeFilter !== 'all' && record.type !== typeFilter) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      const query = searchQuery.toLowerCase();
      return (
        record.description.toLowerCase().includes(query) ||
        record.performedByName.toLowerCase().includes(query) ||
        record.asset.name.toLowerCase().includes(query) ||
        record.asset.assetNumber.toLowerCase().includes(query)
      );
    });
  }, [records, assetFilter, typeFilter, searchQuery]);

  useEffect(() => {
    if (error) {
      notifications.show({ title: 'Fehler', message: (error as Error).message, color: 'red' });
    }
  }, [error]);

  if (isLoading || assetsLoading) {
    return (
      <Stack gap="md">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <TextInput
            label="Suchen"
            placeholder="Beschreibung oder Asset"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
            disabled
          />
          <Group gap="sm" wrap="wrap">
            <Select label="Asset" placeholder="Alle" data={[]} disabled />
            <Select label="Typ" placeholder="Alle" data={maintenanceTypeOptions} value={typeFilter} disabled />
            <Button leftSection={<IconPlus size={16} />} disabled>
              Wartung erfassen
            </Button>
          </Group>
        </Group>
        <ListLoadingSkeleton rows={8} />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <TextInput
          label="Suchen"
          placeholder="Beschreibung oder Asset"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Group gap="sm" wrap="wrap">
          <Select
            label="Asset"
            placeholder="Alle Assets"
            leftSection={<IconFilter size={16} />}
            data={[
              { value: 'all', label: 'Alle Assets' },
              ...(assets ?? []).map((asset) => ({
                value: asset.id,
                label: `${asset.assetNumber} · ${asset.name}`,
              })),
            ]}
            value={assetFilter}
            onChange={(value) => setAssetFilter(value ?? 'all')}
            searchable
          />
          <Select
            label="Typ"
            placeholder="Alle Typen"
            leftSection={<IconFilter size={16} />}
            data={maintenanceTypeOptions}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value ?? 'all')}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={() => onCreateRecord()}>
            Wartung erfassen
          </Button>
        </Group>
      </Group>

      {filteredRecords.length === 0 ? (
        <EmptyState
          title="Keine Wartungsaufzeichnungen"
          message={searchQuery || typeFilter !== 'all' || assetFilter !== 'all'
            ? 'Keine Wartungsaufzeichnungen entsprechen den aktuellen Filtern.'
            : 'Erfassen Sie die erste Wartung, um das Protokoll zu starten.'}
          action={<Button leftSection={<IconPlus size={16} />} onClick={() => onCreateRecord()}>Wartung erfassen</Button>}
        />
      ) : (
        <MaintenanceRecordList
          records={filteredRecords}
          onRecordClick={(record) => {
            const asset = assetMap.get(record.asset.id);
            if (asset) {
              onCreateRecord(asset);
            }
          }}
        />
      )}
    </Stack>
  );
}
