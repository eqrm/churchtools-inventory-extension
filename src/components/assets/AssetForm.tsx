/* eslint-disable max-lines-per-function */
import { useEffect } from 'react';
import {
  Button,
  Card,
  Grid,
  Group,
  Select,
  Stack,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { useCategories, useCategory } from '../../hooks/useCategories';
import { useCreateAsset, useUpdateAsset } from '../../hooks/useAssets';
import { CustomFieldInput } from './CustomFieldInput';
import type { Asset, AssetCreate, AssetStatus, CustomFieldValue } from '../../types/entities';

interface AssetFormProps {
  asset?: Asset;
  onSuccess?: (asset: Asset) => void;
  onCancel?: () => void;
}

interface AssetFormValues {
  name: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  categoryId: string;
  status: AssetStatus;
  location?: string;
  parentAssetId?: string;
  customFieldValues: Record<string, CustomFieldValue>;
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

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const isEditing = Boolean(asset);
  const { data: categories = [] } = useCategories();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const form = useForm<AssetFormValues>({
    initialValues: {
      name: asset?.name || '',
      manufacturer: asset?.manufacturer || '',
      model: asset?.model || '',
      description: asset?.description || '',
      categoryId: asset?.category.id || '',
      status: asset?.status || 'available',
      location: asset?.location || '',
      parentAssetId: asset?.parentAssetId || '',
      customFieldValues: asset?.customFieldValues || {},
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.length > 200) {
          return 'Name must be less than 200 characters';
        }
        return null;
      },
      categoryId: (value) => (!value ? 'Category is required' : null),
    },
  });

  // Get selected category details
  const { data: selectedCategory } = useCategory(form.values.categoryId || '');

  // Update custom field values when category changes
  useEffect(() => {
    if (selectedCategory && !isEditing) {
      // Initialize custom fields with empty values
      const initialCustomFields: Record<string, CustomFieldValue> = {};
      selectedCategory.customFields.forEach((field) => {
        if (field.type === 'checkbox') {
          initialCustomFields[field.name] = false;
        } else if (field.type === 'multi-select') {
          initialCustomFields[field.name] = [];
        } else if (field.type === 'number') {
          initialCustomFields[field.name] = 0;
        } else {
          initialCustomFields[field.name] = '';
        }
      });
      form.setFieldValue('customFieldValues', initialCustomFields);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory?.id, isEditing]);

  const handleSubmit = async (values: AssetFormValues) => {
    try {
      if (isEditing && asset) {
        // Update existing asset
        const updated = await updateAsset.mutateAsync({
          id: asset.id,
          data: {
            name: values.name,
            manufacturer: values.manufacturer || undefined,
            model: values.model || undefined,
            description: values.description || undefined,
            category: {
              id: values.categoryId,
              name: categories.find(c => c.id === values.categoryId)?.name || '',
            },
            status: values.status,
            location: values.location || undefined,
            parentAssetId: values.parentAssetId || undefined,
            customFieldValues: values.customFieldValues,
            isParent: asset.isParent,
            childAssetIds: asset.childAssetIds,
            barcode: asset.barcode,
            qrCode: asset.qrCode,
          },
        });

        notifications.show({
          title: 'Success',
          message: `Asset "${values.name}" has been updated`,
          color: 'green',
        });

        if (onSuccess) {
          onSuccess(updated);
        }
      } else {
        // Create new asset
        const categoryName = categories.find(c => c.id === values.categoryId)?.name || '';
        
        const newAssetData: AssetCreate = {
          name: values.name,
          manufacturer: values.manufacturer || undefined,
          model: values.model || undefined,
          description: values.description || undefined,
          category: {
            id: values.categoryId,
            name: categoryName,
          },
          status: values.status,
          location: values.location || undefined,
          isParent: false,
          parentAssetId: values.parentAssetId || undefined,
          childAssetIds: [],
          customFieldValues: values.customFieldValues,
        };

        const created = await createAsset.mutateAsync(newAssetData);

        notifications.show({
          title: 'Success',
          message: `Asset "${values.name}" has been created with number ${created.assetNumber}`,
          color: 'green',
        });

        if (onSuccess) {
          onSuccess(created);
        } else {
          // Reset form for creating another asset
          form.reset();
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save asset',
        color: 'red',
      });
    }
  };

  const isLoading = createAsset.isPending || updateAsset.isPending;

  return (
    <Card withBorder>
      <form onSubmit={form.onSubmit((values) => {
        void handleSubmit(values);
      })}>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>{isEditing ? 'Edit Asset' : 'Create New Asset'}</Title>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Name"
                placeholder="Asset name"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Category"
                placeholder="Select category"
                required
                disabled={isEditing}
                data={categories.map(cat => ({
                  value: cat.id,
                  label: `${cat.icon || ''} ${cat.name}`.trim(),
                }))}
                {...form.getInputProps('categoryId')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Status"
                placeholder="Select status"
                required
                data={STATUS_OPTIONS}
                {...form.getInputProps('status')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Location"
                placeholder="Where is this asset located?"
                {...form.getInputProps('location')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Manufacturer"
                placeholder="Manufacturer name"
                {...form.getInputProps('manufacturer')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Model"
                placeholder="Model number or name"
                {...form.getInputProps('model')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Additional details about this asset"
                rows={3}
                {...form.getInputProps('description')}
              />
            </Grid.Col>
          </Grid>

          {/* Custom Fields */}
          {selectedCategory && selectedCategory.customFields.length > 0 && (
            <>
              <Title order={4} mt="md">Custom Fields</Title>
              <Grid>
                {selectedCategory.customFields.map((field) => (
                  <Grid.Col key={field.id} span={{ base: 12, md: 6 }}>
                    <CustomFieldInput
                      field={field}
                      value={form.values.customFieldValues[field.name]}
                      onChange={(value) => {
                        form.setFieldValue(`customFieldValues.${field.name}`, value);
                      }}
                      disabled={isLoading}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            </>
          )}

          <Group justify="flex-end" mt="md">
            {onCancel && (
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconX size={16} />}
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={isLoading}
            >
              {isEditing ? 'Save Changes' : 'Create Asset'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
