/* eslint-disable max-lines-per-function */
import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Card,
  Group,
  Menu,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import {
  IconCopy,
  IconDots,
  IconEdit,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useCategories, useDeleteCategory, useDuplicateCategory } from '../../hooks/useCategories';
import { notifications } from '@mantine/notifications';
import { IconDisplay } from './IconDisplay';
import type { AssetCategory } from '../../types/entities';

interface AssetCategoryListProps {
  onEdit?: (category: AssetCategory) => void;
}

export function AssetCategoryList({ onEdit }: AssetCategoryListProps) {
  const [search, setSearch] = useState('');
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<AssetCategory>>({
    columnAccessor: 'name',
    direction: 'asc',
  });

  const { data: categories = [], isLoading, error } = useCategories();
  const deleteCategory = useDeleteCategory();
  const duplicateCategory = useDuplicateCategory();

  // Filter categories based on search
  const filteredCategories = categories.filter((category) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      category.name.toLowerCase().includes(searchLower) ||
      category.customFields.some(field => 
        field.name.toLowerCase().includes(searchLower)
      )
    );
  });

  // Sort categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const { columnAccessor, direction } = sortStatus;
    
    let aValue: string | number = '';
    let bValue: string | number = '';
    
    if (columnAccessor === 'name') {
      aValue = a.name;
      bValue = b.name;
    } else if (columnAccessor === 'customFields') {
      aValue = a.customFields.length;
      bValue = b.customFields.length;
    } else if (columnAccessor === 'createdAt') {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    }
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const handleDelete = async (category: AssetCategory) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      notifications.show({
        title: 'Success',
        message: `Category "${category.name}" has been deleted`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete category',
        color: 'red',
      });
    }
  };

  const handleDuplicate = async (category: AssetCategory) => {
    try {
      const duplicated = await duplicateCategory.mutateAsync({
        id: category.id,
        name: category.name,
        icon: category.icon,
        customFields: category.customFields,
      });
      
      notifications.show({
        title: 'Success',
        message: `Category "${duplicated.name}" has been created`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to duplicate category',
        color: 'red',
      });
    }
  };

  if (error) {
    return (
      <Card withBorder>
        <Text c="red">Error loading categories: {error.message}</Text>
      </Card>
    );
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        <TextInput
          placeholder="Search categories..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
          }}
          mb="md"
        />

        <DataTable
            withTableBorder
            borderRadius="sm"
            striped
            highlightOnHover
            records={sortedCategories}
            onRowClick={({ record }) => {
              // Default action on row click: Edit category
              onEdit?.(record);
            }}
            rowStyle={() => ({ cursor: 'pointer' })}
            columns={[
              {
                accessor: 'icon',
                title: '',
                width: 60,
                render: (category) => (
                  <Box ta="center">
                    <IconDisplay iconName={category.icon} size={24} />
                  </Box>
                ),
              },
              {
                accessor: 'name',
                title: 'Name',
                sortable: true,
                render: (category) => (
                  <Box>
                    <Text fw={500}>{category.name}</Text>
                    <Text size="xs" c="dimmed">
                      Created {new Date(category.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                ),
              },
              {
                accessor: 'customFields',
                title: 'Custom Fields',
                sortable: true,
                render: (category) => (
                  <Group gap="xs">
                    <Text size="sm">{category.customFields.length}</Text>
                    <Text size="xs" c="dimmed">
                      {category.customFields.length === 1 ? 'field' : 'fields'}
                    </Text>
                  </Group>
                ),
              },
              {
                accessor: 'lastModifiedBy',
                title: 'Last Modified',
                render: (category) => (
                  <Box>
                    <Text size="sm">{category.lastModifiedByName}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(category.lastModifiedAt).toLocaleDateString()}
                    </Text>
                  </Box>
                ),
              },
              {
                accessor: 'actions',
                title: '',
                width: 60,
                render: (category) => (
                  <Group gap={0} justify="flex-end">
                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon 
                          variant="subtle" 
                          color="gray"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        {onEdit && (
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(category);
                            }}
                          >
                            Edit
                          </Menu.Item>
                        )}
                        <Menu.Item
                          leftSection={<IconCopy size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDuplicate(category);
                          }}
                          disabled={duplicateCategory.isPending}
                        >
                          Duplicate
                        </Menu.Item>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(category);
                          }}
                          disabled={deleteCategory.isPending}
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
            noRecordsText="No categories found"
          />
      </Stack>
    </Card>
  );
}
