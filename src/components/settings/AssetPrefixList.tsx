import { useState } from 'react';
import {
  Box,
  Button,
  Group,
  Paper,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Modal,
  Stack,
  Alert,
} from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import type { DataTableColumn } from 'mantine-datatable';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { AssetPrefix, AssetPrefixCreate } from '../../types/entities';
import { AssetPrefixForm } from './AssetPrefixForm';
import { useAssetPrefixes } from '../../hooks/useAssetPrefixes';
import { useCreateAssetPrefix } from '../../hooks/useCreateAssetPrefix';
import { useUpdateAssetPrefix } from '../../hooks/useUpdateAssetPrefix';
import { useDeleteAssetPrefix } from '../../hooks/useDeleteAssetPrefix';

export function AssetPrefixList() {
  const { data: prefixes = [] } = useAssetPrefixes();
  const createMutation = useCreateAssetPrefix();
  const updateMutation = useUpdateAssetPrefix();
  const deleteMutation = useDeleteAssetPrefix();

  const loading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState<AssetPrefix | null>(null);

  const handleCreate = async (data: AssetPrefixCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setCreateModalOpened(false);
      notifications.show({
        title: 'Success',
        message: 'Prefix created successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create prefix',
        color: 'red',
      });
    }
  };

  const handleUpdate = async (data: AssetPrefixCreate) => {
    if (!selectedPrefix) return;
    
    try {
      await updateMutation.mutateAsync({ id: selectedPrefix.id, data });
      setEditModalOpened(false);
      setSelectedPrefix(null);
      notifications.show({
        title: 'Success',
        message: 'Prefix updated successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update prefix',
        color: 'red',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPrefix) return;

    try {
      await deleteMutation.mutateAsync(selectedPrefix.id);
      setDeleteModalOpened(false);
      setSelectedPrefix(null);
      notifications.show({
        title: 'Success',
        message: 'Prefix deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete prefix',
        color: 'red',
      });
    }
  };

  const columns: DataTableColumn<AssetPrefix>[] = [
    {
      accessor: 'prefix',
      title: 'Prefix',
      width: 100,
      render: (prefix) => (
        <Badge
          color={prefix.color}
          variant="filled"
          size="lg"
        >
          {prefix.prefix}
        </Badge>
      ),
    },
    {
      accessor: 'description',
      title: 'Description',
    },
    {
      accessor: 'sequence',
      title: 'Current Sequence',
      width: 150,
      render: (prefix) => (
        <Text size="sm" c="dimmed">
          Next: {prefix.prefix}-{String(prefix.sequence + 1).padStart(3, '0')}
        </Text>
      ),
    },
    {
      accessor: 'color',
      title: 'Color',
      width: 100,
      render: (prefix) => (
        <Group gap="xs">
          <Box
            w={20}
            h={20}
            style={{
              backgroundColor: prefix.color,
              borderRadius: 4,
              border: '1px solid #dee2e6',
            }}
          />
          <Text size="xs" c="dimmed">
            {prefix.color}
          </Text>
        </Group>
      ),
    },
    {
      accessor: 'actions',
      title: '',
      width: 60,
      render: (prefix) => (
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={() => {
                setSelectedPrefix(prefix);
                setEditModalOpened(true);
              }}
            >
              Edit
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => {
                setSelectedPrefix(prefix);
                setDeleteModalOpened(true);
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>
              Asset Prefixes
            </Text>
            <Text size="sm" c="dimmed">
              Manage asset number prefixes for different equipment types
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpened(true)}
          >
            Add Prefix
          </Button>
        </Group>

        <Paper withBorder>
          <DataTable
            columns={columns}
            records={prefixes}
            fetching={loading}
            minHeight={200}
            noRecordsText="No prefixes configured"
            highlightOnHover
          />
        </Paper>

        {prefixes.length === 0 && !loading && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="No Prefixes Configured"
            color="blue"
          >
            Create your first asset prefix to organize equipment with independent numbering sequences.
            For example, &quot;CAM&quot; for cameras or &quot;AUD&quot; for audio equipment.
          </Alert>
        )}
      </Stack>

      {/* Create Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Create Asset Prefix"
        size="md"
      >
        <AssetPrefixForm
          onSubmit={handleCreate}
          onCancel={() => setCreateModalOpened(false)}
          existingPrefixes={prefixes.map(p => p.prefix)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedPrefix(null);
        }}
        title="Edit Asset Prefix"
        size="md"
      >
        {selectedPrefix && (
          <AssetPrefixForm
            prefix={selectedPrefix}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditModalOpened(false);
              setSelectedPrefix(null);
            }}
            existingPrefixes={prefixes.filter(p => p.id !== selectedPrefix.id).map(p => p.prefix)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedPrefix(null);
        }}
        title="Delete Prefix"
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete the prefix &quot;{selectedPrefix?.prefix}&quot;?
          </Text>
          <Alert icon={<IconAlertCircle size={16} />} color="yellow">
            This will not delete existing assets with this prefix, but you won&apos;t be able to
            create new assets with this prefix.
          </Alert>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setDeleteModalOpened(false);
                setSelectedPrefix(null);
              }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete Prefix
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
