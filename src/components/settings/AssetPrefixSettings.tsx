import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconHash } from '@tabler/icons-react';
import { useAssets } from '../../hooks/useAssets';

interface AssetPrefixFormValues {
  prefix: string;
}

/**
 * Asset prefix settings component (T227b)
 * Allows configuration of global asset number prefix with:
 * - Preview of next asset number
 * - Count of existing assets
 * - Warning about consistency impact
 */
 
export function AssetPrefixSettings() {
  const { data: assets = [] } = useAssets({});
  const [isSaving, setIsSaving] = useState(false);

  // Get current prefix from localStorage (default: 'ASSET')
  const currentPrefix = localStorage.getItem('assetNumberPrefix') || 'ASSET';

  const form = useForm<AssetPrefixFormValues>({
    initialValues: {
      prefix: currentPrefix,
    },
    validate: {
      prefix: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Prefix is required';
        }
        if (!/^[A-Z0-9-]+$/i.test(value)) {
          return 'Prefix can only contain letters, numbers, and hyphens';
        }
        if (value.length > 10) {
          return 'Prefix must be 10 characters or less';
        }
        return null;
      },
    },
  });

  // Calculate next asset number based on existing assets
  const getNextAssetNumber = (prefix: string): string => {
    if (assets.length === 0) {
      return `${prefix}-001`;
    }

    // Find highest number for this prefix
    const prefixPattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    let maxNumber = 0;

    for (const asset of assets) {
      if (!asset.assetNumber) continue;
      const match = asset.assetNumber.match(prefixPattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    return `${prefix}-${String(maxNumber + 1).padStart(3, '0')}`;
  };

  // Count assets with current prefix
  const assetsWithCurrentPrefix = assets.filter((asset) =>
    asset.assetNumber && asset.assetNumber.toUpperCase().startsWith(currentPrefix.toUpperCase() + '-')
  ).length;

  const handleSubmit = (values: AssetPrefixFormValues) => {
    setIsSaving(true);

    try {
      const normalizedPrefix = values.prefix.trim().toUpperCase();
      localStorage.setItem('assetNumberPrefix', normalizedPrefix);

      notifications.show({
        title: 'Success',
        message: `Asset number prefix updated to "${normalizedPrefix}"`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      form.setInitialValues({ prefix: normalizedPrefix });
      form.setFieldValue('prefix', normalizedPrefix);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update prefix',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const prefixChanged = form.values.prefix.trim().toUpperCase() !== currentPrefix;

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Asset Number Prefix</Title>
        <Text size="sm" c="dimmed" mt="xs">
          Configure the prefix used for automatically generated asset numbers
        </Text>
      </div>

      <Card withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Prefix"
              placeholder="ASSET"
              description="Used as the prefix for all new asset numbers (e.g., ASSET-001)"
              leftSection={<IconHash size={16} />}
              {...form.getInputProps('prefix')}
            />

            {prefixChanged && form.values.prefix && !form.getInputProps('prefix').error && (
              <Alert
                color="blue"
                title="Preview"
                icon={<IconHash size={16} />}
              >
                <Stack gap="xs">
                  <Text size="sm">
                    Next asset number will be: <Code>{getNextAssetNumber(form.values.prefix.trim().toUpperCase())}</Code>
                  </Text>
                </Stack>
              </Alert>
            )}

            <Alert
              color="yellow"
              title="Important"
              icon={<IconAlertCircle size={16} />}
            >
              <Stack gap="xs">
                <Group gap="xs">
                  <Text size="sm">Existing assets with current prefix:</Text>
                  <Badge color="blue">{assetsWithCurrentPrefix}</Badge>
                </Group>
                <Text size="sm">
                  Changing the prefix will only affect new assets. Existing assets will keep their
                  current numbers. For consistency, consider keeping the same prefix throughout
                  your organization's lifetime.
                </Text>
              </Stack>
            </Alert>

            <Group justify="flex-end">
              <Button
                type="button"
                variant="default"
                onClick={() => form.reset()}
                disabled={!prefixChanged || isSaving}
              >
                Reset
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                disabled={!prefixChanged || !form.isValid()}
                loading={isSaving}
              >
                Save Prefix
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      <Card withBorder>
        <Stack gap="xs">
          <Title order={5}>Current Configuration</Title>
          <Group gap="md">
            <div>
              <Text size="sm" c="dimmed">Current Prefix</Text>
              <Code>{currentPrefix}</Code>
            </div>
            <div>
              <Text size="sm" c="dimmed">Next Number</Text>
              <Code>{getNextAssetNumber(currentPrefix)}</Code>
            </div>
            <div>
              <Text size="sm" c="dimmed">Assets with Prefix</Text>
              <Badge>{assetsWithCurrentPrefix}</Badge>
            </div>
            <div>
              <Text size="sm" c="dimmed">Total Assets</Text>
              <Badge>{assets.length}</Badge>
            </div>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
