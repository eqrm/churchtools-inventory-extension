import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Menu,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconDots,
  IconEdit,
  IconMapPin,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useAssets } from '../../hooks/useAssets';

interface Location {
  id: string;
  name: string;
  assetCount: number;
}

interface LocationFormValues {
  name: string;
}

/**
 * Location settings component (T227c)
 * Manage pre-defined location list with:
 * - CRUD operations
 * - Display count of assets per location
 * - Prevent deletion if assets exist
 */
/* eslint-disable max-lines-per-function */
export function LocationSettings() {
  const { data: assets = [] } = useAssets({});
  const [locations, setLocations] = useState<Location[]>(() => {
    // Load locations from localStorage
    const saved = localStorage.getItem('assetLocations');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<LocationFormValues>({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Location name is required';
        }
        if (value.trim().length > 100) {
          return 'Location name must be 100 characters or less';
        }
        // Check for duplicates
        const isDuplicate = locations.some(
          (loc) =>
            loc.name.toLowerCase() === value.trim().toLowerCase() &&
            loc.id !== editingId
        );
        if (isDuplicate) {
          return 'A location with this name already exists';
        }
        return null;
      },
    },
  });

  // Get asset count for each location
  const getLocationWithCounts = (): Location[] => {
    return locations.map((loc) => ({
      ...loc,
      assetCount: assets.filter(
        (asset) => asset.location?.toLowerCase() === loc.name.toLowerCase()
      ).length,
    }));
  };

  const saveLocations = (newLocations: Location[]) => {
    setLocations(newLocations);
    // Save to localStorage (strip assetCount as it's computed)
    const toSave = newLocations.map(({ id, name }) => ({ id, name, assetCount: 0 }));
    localStorage.setItem('assetLocations', JSON.stringify(toSave));
  };

  const handleAdd = (values: LocationFormValues) => {
    const newLocation: Location = {
      id: `loc-${Date.now()}`,
      name: values.name.trim(),
      assetCount: 0,
    };

    saveLocations([...locations, newLocation]);

    notifications.show({
      title: 'Success',
      message: `Location "${newLocation.name}" added`,
      color: 'green',
      icon: <IconCheck size={16} />,
    });

    form.reset();
    setIsAdding(false);
  };

  const handleEdit = (location: Location) => {
    setEditingId(location.id);
    form.setFieldValue('name', location.name);
    setIsAdding(true);
  };

  const handleUpdate = (values: LocationFormValues) => {
    if (!editingId) return;

    const updated = locations.map((loc) =>
      loc.id === editingId ? { ...loc, name: values.name.trim() } : loc
    );

    saveLocations(updated);

    notifications.show({
      title: 'Success',
      message: 'Location updated',
      color: 'green',
      icon: <IconCheck size={16} />,
    });

    form.reset();
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (location: Location) => {
    const locWithCount = getLocationWithCounts().find((l) => l.id === location.id);

    if (locWithCount && locWithCount.assetCount > 0) {
      notifications.show({
        title: 'Cannot Delete',
        message: `"${location.name}" has ${locWithCount.assetCount} asset(s). Please reassign or delete those assets first.`,
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    if (!window.confirm(`Delete location "${location.name}"?`)) {
      return;
    }

    const updated = locations.filter((loc) => loc.id !== location.id);
    saveLocations(updated);

    notifications.show({
      title: 'Success',
      message: `Location "${location.name}" deleted`,
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };

  const handleCancel = () => {
    form.reset();
    setIsAdding(false);
    setEditingId(null);
  };

  const locationsWithCounts = getLocationWithCounts();

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Location Management</Title>
        <Text size="sm" c="dimmed" mt="xs">
          Manage pre-defined locations for quick assignment when creating/editing assets
        </Text>
      </div>

      {!isAdding && (
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsAdding(true)}
        >
          Add Location
        </Button>
      )}

      {isAdding && (
        <Card withBorder>
          <form onSubmit={form.onSubmit(editingId ? handleUpdate : handleAdd)}>
            <Stack gap="md">
              <TextInput
                label={editingId ? 'Edit Location' : 'New Location'}
                placeholder="e.g., Main Warehouse, Storage Room A"
                leftSection={<IconMapPin size={16} />}
                {...form.getInputProps('name')}
                autoFocus
              />

              <Group justify="flex-end">
                <Button
                  variant="default"
                  leftSection={<IconX size={16} />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  leftSection={editingId ? <IconCheck size={16} /> : <IconPlus size={16} />}
                  disabled={!form.isValid()}
                >
                  {editingId ? 'Update' : 'Add'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      )}

      {locationsWithCounts.length === 0 ? (
        <Alert color="blue" icon={<IconMapPin size={16} />}>
          <Text size="sm">
            No locations defined yet. Add locations to make asset management easier.
          </Text>
        </Alert>
      ) : (
        <Card withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Location Name</Table.Th>
                <Table.Th>Assets</Table.Th>
                <Table.Th style={{ width: 50 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {locationsWithCounts.map((location) => (
                <Table.Tr key={location.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconMapPin size={16} />
                      <Text>{location.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={location.assetCount > 0 ? 'blue' : 'gray'}>
                      {location.assetCount}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu position="bottom-end" shadow="md">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => handleEdit(location)}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => handleDelete(location)}
                          disabled={location.assetCount > 0}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {locationsWithCounts.length > 0 && (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />} title="Note">
          <Text size="sm">
            Locations with assets cannot be deleted. Reassign or delete the assets first.
          </Text>
        </Alert>
      )}
    </Stack>
  );
}
