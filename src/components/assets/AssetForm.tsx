 
import { useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Grid,
  Group,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
  Title,
  Badge,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { useCategories, useCategory } from '../../hooks/useCategories';
import { useCreateAsset, useCreateMultiAsset, useUpdateAsset } from '../../hooks/useAssets';
import { useAssetPrefixes } from '../../hooks/useAssetPrefixes';
import { useManufacturerModelData } from '../../hooks/useManufacturerModelData';
import { CustomFieldInput } from './CustomFieldInput';
import { CreatableSelect } from '../common/CreatableSelect';
import type { Asset, AssetCreate, AssetStatus, CustomFieldValue } from '../../types/entities';
import { validateCustomFieldValue } from '../../utils/validators';

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
  prefixId?: string; // T272: Asset prefix selection
  status: AssetStatus;
  location?: string;
  parentAssetId?: string;
  isParent: boolean;
  quantity: number;
  bookable: boolean; // T070: Allow asset to be booked
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
  const { data: prefixes = [] } = useAssetPrefixes();
  const { manufacturers, models, addManufacturer, addModel } = useManufacturerModelData();
  const createAsset = useCreateAsset();
  const createMultiAsset = useCreateMultiAsset();
  const updateAsset = useUpdateAsset();

  const form = useForm<AssetFormValues>({
    initialValues: {
      name: asset?.name || '',
      manufacturer: asset?.manufacturer || '',
      model: asset?.model || '',
      description: asset?.description || '',
      categoryId: asset?.category.id || '',
      prefixId: '', // Default to first prefix or empty
      status: asset?.status || 'available',
      location: asset?.location || '',
      parentAssetId: asset?.parentAssetId || '',
      isParent: asset?.isParent || false,
      quantity: 1,
      bookable: asset?.bookable ?? true, // T070: Default to bookable
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
      // Validate custom fields
      if (selectedCategory) {
        for (const field of selectedCategory.customFields) {
          const value = values.customFieldValues[field.name];
          const error = validateCustomFieldValue(value, field, field.name);
          if (error) {
            form.setFieldError(`customFieldValues.${field.name}`, error);
            return; // Stop submission if validation fails
          }
        }
      }

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
            bookable: values.bookable, // T070: Include bookable status
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
        // Create new asset(s)
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
          isParent: values.isParent,
          parentAssetId: values.parentAssetId || undefined,
          childAssetIds: [],
          bookable: values.bookable, // T070: Include bookable status
          customFieldValues: values.customFieldValues,
          prefixId: values.prefixId || undefined, // T272: Pass selected prefix
        };

        // T092-T096: Handle multi-asset creation
        if (values.isParent && values.quantity >= 2) {
          const createdAssets = await createMultiAsset.mutateAsync({
            data: newAssetData,
            quantity: values.quantity,
          });

          const parentAsset = createdAssets[0];
          if (!parentAsset) {
            throw new Error('Failed to create parent asset');
          }

          notifications.show({
            title: 'Success',
            message: `Created parent asset "${values.name}" with ${values.quantity} children (${parentAsset.assetNumber})`,
            color: 'green',
          });

          if (onSuccess) {
            onSuccess(parentAsset);
          }
        } else {
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

            {/* T272: Asset Prefix Selector */}
            {!isEditing && prefixes.length > 0 && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Asset Prefix"
                  placeholder="Select prefix"
                  description={
                    form.values.prefixId
                      ? (() => {
                          const selectedPrefix = prefixes.find(p => p.id === form.values.prefixId);
                          if (selectedPrefix) {
                            const nextNumber = String(selectedPrefix.sequence + 1).padStart(3, '0');
                            return (
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Next asset number:</Text>
                                <Badge color={selectedPrefix.color} size="sm">
                                  {selectedPrefix.prefix}-{nextNumber}
                                </Badge>
                              </Group>
                            );
                          }
                          return null;
                        })()
                      : 'Choose a prefix for this asset\'s numbering sequence'
                  }
                  data={prefixes.map(prefix => ({
                    value: prefix.id,
                    label: `${prefix.prefix} - ${prefix.description}`,
                  }))}
                  {...form.getInputProps('prefixId')}
                />
              </Grid.Col>
            )}

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Status"
                placeholder="Select status"
                required
                data={STATUS_OPTIONS}
                {...form.getInputProps('status')}
              />
            </Grid.Col>

            {/* T070: Bookable checkbox for asset availability filtering */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Checkbox
                label="Allow Booking"
                description="Enable this asset to be booked by users"
                {...form.getInputProps('bookable', { type: 'checkbox' })}
                mt="md"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Location"
                placeholder="Select or type location"
                description="Choose from pre-defined locations or type a new one and press Enter"
                searchable
                allowDeselect
                data={useMemo(() => {
                  // Get locations from localStorage
                  const savedLocations = JSON.parse(
                    localStorage.getItem('assetLocations') || '[]'
                  ) as Array<{ name: string }>;
                  
                  return savedLocations.map((loc) => ({ value: loc.name, label: loc.name }));
                }, [])}
                onSearchChange={(query) => {
                  // Allow typing custom location
                  if (query && !form.values.location) {
                    form.setFieldValue('location', query);
                  }
                }}
                {...form.getInputProps('location')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <CreatableSelect
                label="Manufacturer"
                placeholder="Select or type manufacturer name"
                description="Choose from existing manufacturers or type to create a new one"
                data={manufacturers}
                value={form.values.manufacturer || ''}
                onChange={(value) => form.setFieldValue('manufacturer', value)}
                onCreate={addManufacturer}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <CreatableSelect
                label="Model"
                placeholder="Select or type model name"
                description="Choose from existing models or type to create a new one"
                data={models}
                value={form.values.model || ''}
                onChange={(value) => form.setFieldValue('model', value)}
                onCreate={addModel}
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

            {/* T092: Parent Asset Checkbox */}
            {!isEditing && (
              <Grid.Col span={12}>
                <Checkbox
                  label="Create as parent asset with multiple children"
                  description="Check this to create multiple identical assets at once"
                  {...form.getInputProps('isParent', { type: 'checkbox' })}
                />
              </Grid.Col>
            )}

            {/* T093: Quantity Field (visible when isParent is true) */}
            {!isEditing && form.values.isParent && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="Quantity"
                  description="Number of child assets to create"
                  placeholder="Enter quantity"
                  min={2}
                  max={100}
                  required
                  {...form.getInputProps('quantity')}
                />
              </Grid.Col>
            )}
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
                      error={form.errors[`customFieldValues.${field.name}`] as string | undefined}
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
