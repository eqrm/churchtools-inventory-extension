import { Stack, Group, Select, TextInput, Button, ActionIcon, SegmentedControl } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useState, memo } from 'react'; // T216: Add memo for performance
import type { ViewFilter, FilterOperator } from '../../types/entities';

interface FilterBuilderProps {
  filters: ViewFilter[];
  onChange: (filters: ViewFilter[]) => void;
}

const FILTER_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'assetNumber', label: 'Asset-Nummer' },
  { value: 'status', label: 'Status' },
  { value: 'category.name', label: 'Kategorie' },
  { value: 'location', label: 'Standort' },
  { value: 'manufacturer', label: 'Hersteller' },
  { value: 'model', label: 'Modell' },
];

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Gleich' },
  { value: 'not-equals', label: 'Ungleich' },
  { value: 'contains', label: 'Enthält' },
  { value: 'not-contains', label: 'Enthält nicht' },
  { value: 'starts-with', label: 'Beginnt mit' },
  { value: 'ends-with', label: 'Endet mit' },
  { value: 'greater-than', label: 'Größer als' },
  { value: 'less-than', label: 'Kleiner als' },
  { value: 'in', label: 'In Liste' },
  { value: 'not-in', label: 'Nicht in Liste' },
  { value: 'is-empty', label: 'Ist leer' },
  { value: 'is-not-empty', label: 'Ist nicht leer' },
];

/**
 * Filter builder component for creating multi-condition filters
 */
function FilterBuilderComponent({ filters, onChange }: FilterBuilderProps) {
  const [currentFilters, setCurrentFilters] = useState<ViewFilter[]>(filters);

  const handleAddFilter = () => {
    const newFilter: ViewFilter = {
      field: 'name',
      operator: 'contains',
      value: '',
      logic: 'AND',
    };
    const updated = [...currentFilters, newFilter];
    setCurrentFilters(updated);
    onChange(updated);
  };

  const handleRemoveFilter = (index: number) => {
    const updated = currentFilters.filter((_, i) => i !== index);
    setCurrentFilters(updated);
    onChange(updated);
  };

  const handleUpdateFilter = (index: number, field: keyof ViewFilter, value: string) => {
    const updated = currentFilters.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    );
    setCurrentFilters(updated);
    onChange(updated);
  };

  return (
    <Stack gap="sm">
      {currentFilters.map((filter, index) => (
        <Group key={index} gap="xs" align="flex-start">
          {index > 0 && (
            <SegmentedControl
              size="xs"
              value={filter.logic || 'AND'}
              onChange={(value) => handleUpdateFilter(index, 'logic', value)}
              data={[
                { value: 'AND', label: 'UND' },
                { value: 'OR', label: 'ODER' },
              ]}
              style={{ width: 100 }}
            />
          )}

          <Select
            placeholder="Feld"
            value={filter.field}
            onChange={(value) => value && handleUpdateFilter(index, 'field', value)}
            data={FILTER_FIELDS}
            style={{ flex: 1, minWidth: 150 }}
          />

          <Select
            placeholder="Operator"
            value={filter.operator}
            onChange={(value) => value && handleUpdateFilter(index, 'operator', value as FilterOperator)}
            data={FILTER_OPERATORS}
            style={{ flex: 1, minWidth: 150 }}
          />

          {!['is-empty', 'is-not-empty'].includes(filter.operator) && (
            <TextInput
              placeholder="Wert"
              value={String(filter.value)}
              onChange={(e) => handleUpdateFilter(index, 'value', e.currentTarget.value)}
              style={{ flex: 2, minWidth: 200 }}
            />
          )}

          <ActionIcon
            color="red"
            variant="light"
            onClick={() => handleRemoveFilter(index)}
            aria-label="Filter entfernen"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}

      <Button
        leftSection={<IconPlus size={16} />}
        variant="light"
        onClick={handleAddFilter}
        fullWidth
      >
        Filter hinzufügen
      </Button>
    </Stack>
  );
}

/**
 * T216: Memoized FilterBuilder to prevent unnecessary re-renders
 * Only re-renders when filters or onChange callback changes
 */
export const FilterBuilder = memo(FilterBuilderComponent);
