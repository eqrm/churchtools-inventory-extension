/**
 * Convert Asset to Parent Modal
 * Convert a standalone asset into a parent asset
 */
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUpdateAsset } from '../../hooks/useAssets';
import type { Asset } from '../../types/entities';

interface ConvertToParentModalProps {
  opened: boolean;
  onClose: () => void;
  asset: Asset;
}

export function ConvertToParentModal({ opened, onClose, asset }: ConvertToParentModalProps) {
  const updateAsset = useUpdateAsset();

  const handleConvert = async () => {
    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        data: {
          isParent: true,
          childAssetIds: [],
        },
      });

      notifications.show({
        title: 'Success',
        message: `"${asset.name}" is now a parent asset`,
        color: 'green',
      });

      onClose();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to convert asset',
        color: 'red',
      });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Convert to Parent Asset" size="sm">
      <Stack gap="md">
        <Text size="sm">
          Convert <strong>{asset.name}</strong> into a parent asset? You'll be able to add child assets to it.
        </Text>
        <Text size="xs" c="dimmed">
          This will allow you to manage multiple identical assets as a group.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConvert}>Convert to Parent</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
