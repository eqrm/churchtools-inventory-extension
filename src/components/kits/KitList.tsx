/**
 * KitList Component
 * Displays all equipment kits in a data table with actions
 * 
 * @module components/kits/KitList
 */

import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { IconPlus, IconBoxMultiple } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import { useNavigate } from 'react-router-dom';
import { useKits } from '../../hooks/useKits';
import type { Kit } from '../../types/entities';
import { EmptyState } from '../common/EmptyState';
import { ListLoadingSkeleton } from '../common/ListLoadingSkeleton';

/**
 * Kit list component - simplified version
 * Shows all kits with type and basic info
 */
export function KitList() {
  const navigate = useNavigate();
  const { data: kits, isLoading, error } = useKits();

  if (isLoading) {
    return (
      <Stack>
        <Group justify="space-between">
          <Text size="xl" fw={700}>Equipment-Kits</Text>
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/kits/new')}>
            Neues Kit
          </Button>
        </Group>
        <ListLoadingSkeleton rows={8} height={60} />
      </Stack>
    );
  }

  if (error) return <Text c="red">Fehler beim Laden der Kits</Text>;

  if (!kits || kits.length === 0) {
    return (
      <EmptyState
        title="Keine Kits vorhanden"
        message="Erstellen Sie Ihr erstes Equipment-Kit, um mehrere Assets zusammenzufassen."
        icon={<IconBoxMultiple size={48} stroke={1.5} />}
        action={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/kits/new')}
          >
            Neues Kit erstellen
          </Button>
        }
      />
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="xl" fw={700}>Equipment-Kits</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/kits/new')}>
          Neues Kit
        </Button>
      </Group>
      <DataTable
        columns={[
          { accessor: 'name', title: 'Name' },
          {
            accessor: 'type',
            title: 'Typ',
            render: (kit: Kit) => (
              <Badge color={kit.type === 'fixed' ? 'blue' : 'green'}>
                {kit.type === 'fixed' ? 'Fest' : 'Flexibel'}
              </Badge>
            ),
          },
        ]}
        records={kits}
        onRowClick={({ record }) => navigate(`/kits/${record.id}`)}
        idAccessor="id"
      />
    </Stack>
  );
}

