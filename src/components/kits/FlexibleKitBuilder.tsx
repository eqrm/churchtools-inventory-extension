/**
 * FlexibleKitBuilder Component
 * UI for defining pool requirements for flexible kits
 */

import { useState } from 'react';
import { Stack, Text, Button, Group, Select, NumberInput, ActionIcon, Paper } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useCategories } from '../../hooks/useCategories';

interface PoolRequirement {
  categoryId: string;
  categoryName: string;
  quantity: number;
  filters?: Record<string, unknown>;
}

interface FlexibleKitBuilderProps {
  value: PoolRequirement[];
  onChange: (value: PoolRequirement[]) => void;
}

export function FlexibleKitBuilder({ value, onChange }: FlexibleKitBuilderProps) {
  const { data: categories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const handleAddPool = () => {
    if (!selectedCategoryId || quantity < 1) return;
    
    const category = categories?.find(c => c.id === selectedCategoryId);
    if (!category) return;

    // Check if already added
    if (value.some(pr => pr.categoryId === category.id)) {
      return;
    }

    onChange([
      ...value,
      {
        categoryId: category.id,
        categoryName: category.name,
        quantity,
      },
    ]);
    setSelectedCategoryId('');
    setQuantity(1);
  };

  const handleRemovePool = (categoryId: string) => {
    onChange(value.filter(pr => pr.categoryId !== categoryId));
  };

  return (
    <Stack gap="sm">
      <Text fw={500}>Pool-Anforderungen</Text>
      
      {value.length > 0 && (
        <Stack gap="xs">
          {value.map((pool) => (
            <Paper key={pool.categoryId} p="xs" withBorder>
              <Group justify="space-between">
                <Text size="sm">
                  {pool.quantity}x {pool.categoryName}
                </Text>
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => handleRemovePool(pool.categoryId)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      <Group>
        <NumberInput
          placeholder="Anzahl"
          min={1}
          value={quantity}
          onChange={(val) => setQuantity(typeof val === 'number' ? val : 1)}
          style={{ width: 100 }}
        />
        <Select
          placeholder="Kategorie auswählen"
          data={categories?.map(c => ({ value: c.id, label: c.name })) || []}
          value={selectedCategoryId}
          onChange={(val) => setSelectedCategoryId(val || '')}
          searchable
          style={{ flex: 1 }}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddPool}
          disabled={!selectedCategoryId || quantity < 1}
        >
          Hinzufügen
        </Button>
      </Group>

      {value.length === 0 && (
        <Text size="sm" c="dimmed">
          Noch keine Pool-Anforderungen definiert
        </Text>
      )}
    </Stack>
  );
}
