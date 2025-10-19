/* eslint-disable max-lines-per-function */
import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Menu,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import {
  IconDots,
  IconEdit,
  IconEye,
  IconFilter,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useAssets, useDeleteAsset } from '../../hooks/useAssets';
import { useCategories } from '../../hooks/useCategories';
import { notifications } from '@mantine/notifications';
import { AssetStatusBadge } from './AssetStatusBadge';
import type { Asset, AssetStatus, AssetFilters } from '../../types/entities';

interface AssetListProps {
  onView?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onCreateNew?: () => void;
  initialFilters?: AssetFilters;
}

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'in-use', label: 'In Use' },
  { value: 'broken', label: 'Broken' },
  { value: 'in-repair', label: 'In Repair' },
  { value: 'installed', label: 'Installed' },
  { value: 'sold', label: 'Sold' },
  { value: 'destroyed', label: 'Destroyed' },
];

export function AssetList({ onView, onEdit, onCreateNew, initialFilters }: AssetListProps) {
  const [filters, setFilters] = useState<AssetFilters>(initialFilters || {});
  const [showFilters, setShowFilters] = useState(false);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Asset>>({
    columnAccessor: 'assetNumber',
    direction: 'asc',
  });

  const { data: categories = [] } = useCategories();
  const { data: assets = [], isLoading, error } = useAssets(filters);
  const deleteAsset = useDeleteAsset();

  // Sort assets
  const sortedAssets = [...assets].sort((a, b) => {
    const { columnAccessor, direction } = sortStatus;
    
    let aValue: string | number = '';
    let bValue: string | number = '';
    
    if (columnAccessor === 'assetNumber') {
      aValue = a.assetNumber;
      bValue = b.assetNumber;
    } else if (columnAccessor === 'name') {
      aValue = a.name;
      bValue = b.name;
    } else if (columnAccessor === 'category') {
      aValue = a.category.name;
      bValue = b.category.name;
    } else if (columnAccessor === 'status') {
      aValue = a.status;
      bValue = b.status;
    } else if (columnAccessor === 'location') {
      aValue = a.location || '';
      bValue = b.location || '';
    }
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`Are you sure you want to delete "${asset.name}" (${asset.assetNumber})? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAsset.mutateAsync(asset.id);
      notifications.show({
        title: 'Success',
        message: `Asset "${asset.name}" has been deleted`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete asset',
        color: 'red',
      });
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Boolean(
    filters.categoryId || 
    filters.status || 
    filters.location || 
    filters.search
  );

  if (error) {
    return (
      <Card withBorder>
        <Text c="red">Error loading assets: {error.message}</Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Assets</Title>
        <Group>
          <Button
            variant={showFilters ? 'filled' : 'default'}
            leftSection={<IconFilter size={16} />}
            onClick={() => {
              setShowFilters(!showFilters);
            }}
          >
            Filters
            {hasActiveFilters && (
              <Badge size="xs" circle ml="xs">
                {[filters.categoryId, filters.status, filters.location, filters.search].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          {onCreateNew && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={onCreateNew}
            >
              New Asset
            </Button>
          )}
        </Group>
      </Group>

      {showFilters && (
        <Card withBorder>
          <Stack gap="md">
            <Group align="flex-end">
              <TextInput
                label="Search"
                placeholder="Search by name, asset number, or description"
                leftSection={<IconSearch size={16} />}
                value={filters.search || ''}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.currentTarget.value });
                }}
                style={{ flex: 1 }}
              />
              {hasActiveFilters && (
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={16} />}
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </Group>

            <Group grow>
              <Select
                label="Category"
                placeholder="All categories"
                value={filters.categoryId || null}
                onChange={(val) => {
                  setFilters({ ...filters, categoryId: val || undefined });
                }}
                data={categories.map(cat => ({
                  value: cat.id,
                  label: `${cat.icon || ''} ${cat.name}`.trim(),
                }))}
                clearable
              />

              <Select
                label="Status"
                placeholder="All statuses"
                value={(filters.status as string) || null}
                onChange={(val) => {
                  setFilters({ ...filters, status: val ? (val as AssetStatus) : undefined });
                }}
                data={STATUS_OPTIONS}
                clearable
              />

              <TextInput
                label="Location"
                placeholder="Filter by location"
                value={filters.location || ''}
                onChange={(e) => {
                  setFilters({ ...filters, location: e.currentTarget.value || undefined });
                }}
              />
            </Group>
          </Stack>
        </Card>
      )}

      <Card withBorder>
        <DataTable
          withTableBorder
          borderRadius="sm"
          striped
          highlightOnHover
          records={sortedAssets}
          columns={[
            {
              accessor: 'assetNumber',
              title: 'Asset #',
              sortable: true,
              width: 120,
              render: (asset) => (
                <Text fw={600} size="sm">
                  {asset.assetNumber}
                </Text>
              ),
            },
            {
              accessor: 'name',
              title: 'Name',
              sortable: true,
              render: (asset) => (
                <Box>
                  <Text fw={500}>{asset.name}</Text>
                  {asset.description && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {asset.description}
                    </Text>
                  )}
                </Box>
              ),
            },
            {
              accessor: 'category',
              title: 'Category',
              sortable: true,
              render: (asset) => (
                <Badge variant="light" color="blue">
                  {asset.category.name}
                </Badge>
              ),
            },
            {
              accessor: 'status',
              title: 'Status',
              sortable: true,
              render: (asset) => <AssetStatusBadge status={asset.status} />,
            },
            {
              accessor: 'location',
              title: 'Location',
              sortable: true,
              render: (asset) => (
                <Text size="sm">
                  {asset.location || <Text c="dimmed">—</Text>}
                </Text>
              ),
            },
            {
              accessor: 'manufacturer',
              title: 'Manufacturer',
              render: (asset) => (
                <Box>
                  <Text size="sm">{asset.manufacturer || <Text c="dimmed">—</Text>}</Text>
                  {asset.model && (
                    <Text size="xs" c="dimmed">
                      {asset.model}
                    </Text>
                  )}
                </Box>
              ),
            },
            {
              accessor: 'actions',
              title: '',
              width: 60,
              render: (asset) => (
                <Group gap={0} justify="flex-end">
                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      {onView && (
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={() => {
                            onView(asset);
                          }}
                        >
                          View Details
                        </Menu.Item>
                      )}
                      {onEdit && (
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => {
                            onEdit(asset);
                          }}
                        >
                          Edit
                        </Menu.Item>
                      )}
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => {
                          void handleDelete(asset);
                        }}
                        disabled={deleteAsset.isPending}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              ),
            },
          ]}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          fetching={isLoading}
          minHeight={150}
          noRecordsText={hasActiveFilters ? "No assets match your filters" : "No assets found"}
        />
      </Card>
    </Stack>
  );
}
