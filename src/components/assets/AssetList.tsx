/* eslint-disable max-lines-per-function */
import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconArrowUp,
  IconDots,
  IconEdit,
  IconEye,
  IconFilter,
  IconLayoutList,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useAssets, useDeleteAsset, useCreateAsset } from '../../hooks/useAssets';
import { useCategories } from '../../hooks/useCategories';
import { useAssetPrefixes } from '../../hooks/useAssetPrefixes';
import { useUndoStore } from '../../stores/undoStore';
import { useMaintenanceSchedules } from '../../hooks/useMaintenance';
import { notifications } from '@mantine/notifications';
import { AssetStatusBadge } from './AssetStatusBadge';
import { CustomFieldFilterInput } from './CustomFieldFilterInput';
import { IconDisplay } from '../categories/IconDisplay';
import { MaintenanceReminderBadge } from '../maintenance/MaintenanceReminderBadge';
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

const ASSET_TYPE_OPTIONS = [
  { value: 'all', label: 'All Assets' },
  { value: 'parent', label: 'Parent Assets Only' },
  { value: 'child', label: 'Child Assets Only' },
  { value: 'standalone', label: 'Standalone Assets Only' },
];

export function AssetList({ onView, onEdit, onCreateNew, initialFilters }: AssetListProps) {
  const navigate = useNavigate(); // T263 - E4: Router navigation for direct clicks
  const [filters, setFilters] = useState<AssetFilters>(initialFilters || {});
  const [showFilters, setShowFilters] = useState(false);
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [prefixFilter, setPrefixFilter] = useState<string>('all'); // T275: Prefix-based filtering
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Asset>>({
    columnAccessor: 'assetNumber',
    direction: 'asc',
  });
  
  // T214: Pagination for large asset lists (performance optimization)
  const PAGE_SIZE = 50; // Show 50 rows per page for optimal performance
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useCategories();
  const { data: prefixes = [] } = useAssetPrefixes(); // T275: Load prefixes for filtering
  const { data: assets = [], isLoading, error } = useAssets(filters);
  const { data: maintenanceSchedules = [] } = useMaintenanceSchedules();
  const deleteAsset = useDeleteAsset();
  const createAsset = useCreateAsset();
  const addUndoAction = useUndoStore((state) => state.addAction);
  const getUndoAction = useUndoStore((state) => state.getAction);
  const removeUndoAction = useUndoStore((state) => state.removeAction);

  // T263 - E4: Handle row click for direct navigation
  const handleRowClick = (params: { record: Asset; index: number; event: React.MouseEvent }) => {
    const asset = params.record;
    
    // If onView callback provided, use it (for modal/drawer behavior)
    if (onView) {
      onView(asset);
    } else {
      // Otherwise, navigate to asset detail page
      navigate(`/assets/${asset.id}`);
    }
  };

  // Filter assets by type (parent/child/standalone) - T099
  // T275: Also filter by prefix
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // Filter by asset type
      if (assetTypeFilter === 'parent' && !asset.isParent) return false;
      if (assetTypeFilter === 'child' && !asset.parentAssetId) return false;
      if (assetTypeFilter === 'standalone' && (asset.isParent || asset.parentAssetId)) return false;
      
      // T275: Filter by prefix
      if (prefixFilter !== 'all') {
        const selectedPrefix = prefixes.find(p => p.id === prefixFilter);
        if (selectedPrefix && !asset.assetNumber.startsWith(`${selectedPrefix.prefix}-`)) {
          return false;
        }
      }
      
      return true;
    });
  }, [assets, assetTypeFilter, prefixFilter, prefixes]);

  // Sort assets (memoized to avoid re-sorting on every render) - T217
  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
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
  }, [filteredAssets, sortStatus]);

  // T214: Pagination for performance (only render current page)
  const paginatedAssets = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return sortedAssets.slice(from, to);
  }, [sortedAssets, page, PAGE_SIZE]);

  const handleDelete = async (asset: Asset) => {
    // T102: Parent deletion validation
    if (asset.isParent && asset.childAssetIds && asset.childAssetIds.length > 0) {
      notifications.show({
        title: 'Cannot Delete Parent Asset',
        message: `This parent asset has ${asset.childAssetIds.length} child assets. Please delete or reassign children first.`,
        color: 'red',
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${asset.name}" (${asset.assetNumber})?`)) {
      return;
    }

    try {
      // T225: Store asset for undo before deletion
      const deletedAsset = { ...asset };
      
      await deleteAsset.mutateAsync(asset.id);
      
      // T225: Add undo action to queue
      const undoId = addUndoAction({
        type: 'delete-asset',
        data: deletedAsset,
        label: `${deletedAsset.name} (${deletedAsset.assetNumber})`,
      });
      
      // T225: Show notification with undo button
      // Note: Mantine notifications don't support action buttons directly
      // Using message with instructions instead
      notifications.show({
        id: undoId,
        title: 'Asset Deleted',
        message: `"${deletedAsset.name}" has been deleted. Click to undo within 10 seconds.`,
        color: 'green',
        autoClose: 10000,
        withCloseButton: true,
        onClick: async () => {
          // Get the action from store
          const action = getUndoAction(undoId);
          if (!action) return;
          
          try {
            // Restore the asset
            await createAsset.mutateAsync(action.data as Asset);
            
            // Remove from undo queue
            removeUndoAction(undoId);
            
            // Close the notification
            notifications.hide(undoId);
            
            // Show success
            notifications.show({
              title: 'Asset Restored',
              message: `"${deletedAsset.name}" has been restored`,
              color: 'blue',
            });
          } catch (err) {
            notifications.show({
              title: 'Restore Failed',
              message: err instanceof Error ? err.message : 'Failed to restore asset',
              color: 'red',
            });
          }
        },
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

  // Memoize filter check to avoid recalculation on every render - T217
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.categoryId || 
      filters.status || 
      filters.location || 
      filters.search ||
      (filters.customFields && Object.keys(filters.customFields).length > 0)
    );
  }, [filters]);

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
                {[
                  filters.categoryId, 
                  filters.status, 
                  filters.location, 
                  filters.search,
                  ...(filters.customFields ? Object.keys(filters.customFields) : [])
                ].filter(Boolean).length}
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
                label="Asset Type"
                value={assetTypeFilter}
                onChange={(val) => setAssetTypeFilter(val || 'all')}
                data={ASSET_TYPE_OPTIONS}
              />

              {/* T275: Asset Prefix Filter */}
              {prefixes.length > 0 && (
                <Select
                  label="Asset Prefix"
                  placeholder="All prefixes"
                  value={prefixFilter}
                  onChange={(val) => setPrefixFilter(val || 'all')}
                  data={[
                    { value: 'all', label: 'All Prefixes' },
                    ...prefixes.map(prefix => ({
                      value: prefix.id,
                      label: `${prefix.prefix} - ${prefix.description}`,
                    })),
                  ]}
                  clearable
                />
              )}

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

            {filters.categoryId && (() => {
              const selectedCategory = categories.find(c => c.id === filters.categoryId);
              if (selectedCategory && selectedCategory.customFields.length > 0) {
                return (
                  <>
                    <Text size="sm" fw={600} mt="md">Custom Field Filters</Text>
                    <Group grow>
                      {selectedCategory.customFields.map((field) => (
                        <CustomFieldFilterInput
                          key={field.id}
                          field={field}
                          value={filters.customFields?.[field.id]}
                          onChange={(value) => {
                            const currentCustomFields = filters.customFields || {};
                            const newCustomFields = value === undefined
                              ? Object.fromEntries(
                                  Object.entries(currentCustomFields).filter(([k]) => k !== field.id)
                                )
                              : { ...currentCustomFields, [field.id]: value };
                            
                            setFilters({
                              ...filters,
                              customFields: Object.keys(newCustomFields).length > 0 
                                ? newCustomFields 
                                : undefined,
                            });
                          }}
                        />
                      ))}
                    </Group>
                  </>
                );
              }
              return null;
            })()}
          </Stack>
        </Card>
      )}

      <Card withBorder>
        <DataTable
          withTableBorder
          borderRadius="sm"
          striped
          highlightOnHover
          records={paginatedAssets} // T214: Only render current page for performance
          onRowClick={handleRowClick} // T263 - E4: Direct click navigation
          rowStyle={() => ({ cursor: 'pointer' })} // T264 - E4: Visual feedback
          // T214: Pagination configuration for large lists
          totalRecords={sortedAssets.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          paginationText={({ from, to, totalRecords }) => 
            `Showing ${from} to ${to} of ${totalRecords} assets`
          }
          columns={[
            {
              accessor: 'type',
              title: '',
              width: 40,
              render: (asset) => {
                if (asset.isParent) {
                  return (
                    <Group gap={4}>
                      <IconLayoutList size={16} color="var(--mantine-color-blue-6)" />
                      <Badge size="xs" color="blue" circle>
                        {asset.childAssetIds?.length || 0}
                      </Badge>
                    </Group>
                  );
                }
                if (asset.parentAssetId) {
                  return <IconArrowUp size={16} color="var(--mantine-color-gray-6)" />;
                }
                return null;
              },
            },
            {
              accessor: 'assetNumber',
              title: 'Asset #',
              sortable: true,
              width: 120,
              render: (asset) => (
                <Text fw={600} size="sm" pl={asset.parentAssetId ? 'md' : 0}>
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
              render: (asset) => {
                const icon = asset.category.icon;
                return (
                  <Badge 
                    variant="light" 
                    color="blue" 
                    leftSection={icon ? <IconDisplay iconName={icon} size={14} /> : undefined}
                  >
                    {asset.category.name}
                  </Badge>
                );
              },
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
                <Text size="sm" c={asset.location ? undefined : 'dimmed'}>
                  {asset.location || '—'}
                </Text>
              ),
            },
            {
              accessor: 'manufacturer',
              title: 'Manufacturer',
              render: (asset) => (
                <Box>
                  <Text size="sm" c={asset.manufacturer ? undefined : 'dimmed'}>
                    {asset.manufacturer || '—'}
                  </Text>
                  {asset.model && (
                    <Text size="xs" c="dimmed">
                      {asset.model}
                    </Text>
                  )}
                </Box>
              ),
            },
            {
              accessor: 'maintenance',
              title: 'Maintenance',
              width: 120,
              render: (asset) => {
                const schedule = maintenanceSchedules.find(s => s.assetId === asset.id);
                return schedule ? <MaintenanceReminderBadge schedule={schedule} /> : null;
              },
            },
            {
              accessor: 'actions',
              title: '',
              width: 60,
              render: (asset) => (
                <Group gap={0} justify="flex-end">
                  <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                      <ActionIcon 
                        variant="subtle" 
                        color="gray"
                        onClick={(e) => {
                          e.stopPropagation(); // T265 - E4: Stop event propagation
                        }}
                      >
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      {onView && (
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={(e) => {
                            e.stopPropagation(); // T265 - E4: Stop event propagation
                            onView(asset);
                          }}
                        >
                          View Details
                        </Menu.Item>
                      )}
                      {onEdit && (
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={(e) => {
                            e.stopPropagation(); // T265 - E4: Stop event propagation
                            onEdit(asset);
                          }}
                        >
                          Edit
                        </Menu.Item>
                      )}
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={(e) => {
                          e.stopPropagation(); // T265 - E4: Stop event propagation
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

/**
 * Memoized AssetList component to prevent unnecessary re-renders (T216)
 * Only re-renders when props actually change
 */
export const AssetListMemo = memo(AssetList);
