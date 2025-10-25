/**
 * FlexibleKitBuilder Component
 * UI for defining pool requirements for flexible kits
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Stack,
  Text,
  Button,
  Group,
  Select,
  NumberInput,
  ActionIcon,
  Paper,
  SegmentedControl,
  Badge,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useCategories } from '../../hooks/useCategories';
import { useAssets } from '../../hooks/useAssets';
import type { Kit } from '../../types/entities';

type PoolRequirement = NonNullable<Kit['poolRequirements']>[number];
type SelectionMode = 'category' | 'parentAsset';

interface FlexibleKitBuilderProps {
  value: PoolRequirement[];
  onChange: (value: PoolRequirement[]) => void;
}

export function FlexibleKitBuilder({ value, onChange }: FlexibleKitBuilderProps) {
  const { data: categories } = useCategories();
  const { data: parentAssets = [] } = useAssets({ isParent: true });
  const [mode, setMode] = useState<SelectionMode>('category');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedParentAssetId, setSelectedParentAssetId] = useState<string>('');

  useEffect(() => {
    setSelectedCategoryId('');
    setSelectedParentAssetId('');
  }, [mode]);

  const parentAssetOptions = useMemo(
    () =>
      parentAssets.map((asset) => ({
        value: asset.id,
        label: `${asset.name} (${asset.assetNumber})`,
        categoryId: asset.category.id,
        categoryName: asset.category.name,
      })),
    [parentAssets],
  );

  const parentAssetLookup = useMemo(
    () => new Map(parentAssets.map((asset) => [asset.id, asset])),
    [parentAssets],
  );

  const handleAddPool = () => {
    if (quantity < 1) {
      return;
    }

    if (mode === 'category') {
      if (!selectedCategoryId) return;
      const category = categories?.find((c) => c.id === selectedCategoryId);
      if (!category) return;

      if (value.some((pr) => !pr.filters?.parentAssetId && pr.categoryId === category.id)) {
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
    } else {
      if (!selectedParentAssetId) return;
      const parentAssetOption = parentAssetOptions.find((opt) => opt.value === selectedParentAssetId);
      const parentAsset = parentAssetLookup.get(selectedParentAssetId);
      if (!parentAssetOption || !parentAsset) return;

      if (value.some((pr) => pr.filters?.parentAssetId === selectedParentAssetId)) {
        return;
      }

      onChange([
        ...value,
        {
          categoryId: parentAssetOption.categoryId,
          categoryName: parentAssetOption.categoryName,
          quantity,
          filters: { parentAssetId: selectedParentAssetId },
        },
      ]);
      setSelectedParentAssetId('');
    }

    setQuantity(1);
  };

  const handleRemovePool = (index: number) => {
    onChange(value.filter((_, idx) => idx !== index));
  };

  return (
    <Stack gap="sm">
      <Text fw={500}>Pool-Anforderungen</Text>

      <SegmentedControl
        value={mode}
        onChange={(val: SelectionMode) => setMode(val)}
        data={[
          { label: 'Nach Kategorie', value: 'category' },
          { label: 'Eltern-Asset', value: 'parentAsset' },
        ]}
        size="xs"
      />

      {value.length > 0 && (
        <Stack gap="xs">
          {value.map((pool, index) => {
            const parentAssetId = typeof pool.filters?.parentAssetId === 'string' ? pool.filters.parentAssetId : undefined;
            const parentAsset = parentAssetId ? parentAssetLookup.get(parentAssetId) : undefined;
            const displayLabel = parentAsset
              ? `${pool.quantity}x ${parentAsset.name}`
              : `${pool.quantity}x ${pool.categoryName}`;

            return (
              <Paper key={parentAssetId ?? `${pool.categoryId}-${index}`} p="xs" withBorder>
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm">{displayLabel}</Text>
                    {parentAsset && (
                      <Group gap={6}>
                        <Badge size="xs" color="blue">
                          Parent-Asset
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Kategorie: {pool.categoryName}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                  <ActionIcon color="red" variant="subtle" onClick={() => handleRemovePool(index)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Group wrap="nowrap">
        <NumberInput
          placeholder="Anzahl"
          min={1}
          value={quantity}
          onChange={(val) => setQuantity(typeof val === 'number' ? val : 1)}
          style={{ width: 100 }}
        />
        {mode === 'category' ? (
          <Select
            placeholder="Kategorie auswählen"
            data={categories?.map((c) => ({ value: c.id, label: c.name })) || []}
            value={selectedCategoryId}
            onChange={(val) => setSelectedCategoryId(val || '')}
            searchable
            style={{ flex: 1 }}
          />
        ) : (
          <Select
            placeholder="Eltern-Asset auswählen"
            data={parentAssetOptions}
            value={selectedParentAssetId}
            onChange={(val) => setSelectedParentAssetId(val || '')}
            searchable
            nothingFound="Keine passenden Assets"
            style={{ flex: 1 }}
          />
        )}
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddPool}
          disabled={
            quantity < 1 || (mode === 'category' ? !selectedCategoryId : !selectedParentAssetId)
          }
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
