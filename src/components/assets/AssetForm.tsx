 
import { useEffect, useMemo, useState } from 'react';
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
import { useCurrentUser } from '../../hooks/useCurrentUser';
import {
  getStoredModuleDefaultPrefixId,
  getStoredPersonDefaultPrefixId,
  resolvePrefixForAutoNumbering,
  setStoredPersonDefaultPrefixId,
} from '../../services/assets/autoNumbering';
import { useMasterData } from '../../hooks/useMasterDataNames';
import { generateAssetNameFromTemplate, DEFAULT_ASSET_NAME_TEMPLATE } from '../../utils/assetNameTemplate';
import { MASTER_DATA_DEFINITIONS, normalizeMasterDataName } from '../../utils/masterData';
import { CustomFieldInput } from './CustomFieldInput';
import { MasterDataSelectInput } from '../common/MasterDataSelectInput';
// Photo features removed due to storage size constraints
import type { Asset, AssetCreate, AssetStatus, CustomFieldValue } from '../../types/entities';
 import { validateCustomFieldValue } from '../../utils/validators';
import { ASSET_STATUS_OPTIONS } from '../../constants/assetStatuses';

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


export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const isEditing = Boolean(asset);
  const { data: categories = [] } = useCategories();
  const { data: prefixes = [] } = useAssetPrefixes();
  const { names: locationNames, addItem: addLocation } = useMasterData(MASTER_DATA_DEFINITIONS.locations);
  const { names: manufacturerNames, addItem: addManufacturer } = useMasterData(
    MASTER_DATA_DEFINITIONS.manufacturers
  );
  const { names: modelNames, addItem: addModel } = useMasterData(MASTER_DATA_DEFINITIONS.models);
  const createAsset = useCreateAsset();
  const createMultiAsset = useCreateMultiAsset();
  const updateAsset = useUpdateAsset();
  const { data: currentUser } = useCurrentUser();


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

  const currentUserId = currentUser?.id ?? null;
  const selectedPrefixId = form.values.prefixId;

  const prefixOptions = useMemo(
    () =>
      prefixes.map(prefix => ({
        value: prefix.id,
        label: prefix.description ? `${prefix.prefix} - ${prefix.description}` : prefix.prefix,
      })),
    [prefixes]
  );

  const selectedPrefix = useMemo(
    () => prefixes.find(prefix => prefix.id === selectedPrefixId) ?? null,
    [prefixes, selectedPrefixId]
  );

  const prefixDescription = selectedPrefix
    ? (
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            Next asset number:
          </Text>
          <Badge color={selectedPrefix.color} size="sm">
            {`${selectedPrefix.prefix}-${String(selectedPrefix.sequence + 1).padStart(3, '0')}`}
          </Badge>
        </Group>
      )
    : 'Choose a prefix for this asset\'s numbering sequence';

  useEffect(() => {
    if (isEditing) {
      return;
    }

    if (selectedPrefixId) {
      return;
    }

    if (prefixes.length === 0) {
      return;
    }

    let cancelled = false;

    const applyStoredDefaults = async () => {
      const moduleDefault = getStoredModuleDefaultPrefixId();
      const personDefault = currentUserId ? await getStoredPersonDefaultPrefixId(currentUserId) : null;

      const resolution = resolvePrefixForAutoNumbering({
        prefixes,
        personDefaultPrefixId: personDefault,
        moduleDefaultPrefixId: moduleDefault,
      });

      if (!cancelled && resolution.prefixId) {
        form.setFieldValue('prefixId', resolution.prefixId);
      }
    };

    void applyStoredDefaults();

    return () => {
      cancelled = true;
    };
  }, [isEditing, prefixes, selectedPrefixId, currentUserId, form]);

  // Track whether the user has manually edited the name field. If not, we auto-fill
  // the name with a generated value based on other fields so the user sees a preview.
  const [nameManuallyEdited, setNameManuallyEdited] = useState<boolean>(Boolean(asset?.name));

  // Compute the generated name preview from template and relevant fields
  const generatedName = useMemo(() => {
    const prefixPreview = (() => {
      const selected = prefixes.find(p => p.id === form.values.prefixId);
      if (selected) return `${selected.prefix}-${String(selected.sequence + 1).padStart(3, '0')}`;
      return '';
    })();

    const data = {
      Manufacturer: form.values.manufacturer || '',
      Model: form.values.model || '',
      'Model Name': form.values.model || '',
      'Asset Number': prefixPreview,
      'Serial Number': '',
    } as Record<string, string>;

    return generateAssetNameFromTemplate(DEFAULT_ASSET_NAME_TEMPLATE, data);
  }, [form.values.manufacturer, form.values.model, form.values.prefixId, prefixes]);

  // Auto-fill the name if the user hasn't manually typed one
  useEffect(() => {
    if (!nameManuallyEdited) {
      form.setFieldValue('name', generatedName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedName]);

  // When editing an existing asset, ensure its manufacturer/model are present in
  // the localStorage-backed lists so the CreatableSelect shows them consistently
  useEffect(() => {
    if (asset) {
      if (asset.location) addLocation(asset.location);
      if (asset.manufacturer) addManufacturer(asset.manufacturer);
      if (asset.model) addModel(asset.model);
    }
    // only run when asset changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

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
      // Ensure manufacturer/model values are persisted to localStorage-backed lists
      if (values.location) {
        addLocation(values.location);
      }
      if (values.manufacturer) {
        addManufacturer(values.manufacturer);
      }
      if (values.model) {
        addModel(values.model);
      }

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

          // Photo upload removed — parent asset created without photos

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

          // Photo upload removed — asset created without photos

          // Debug: show localStorage after creation
          try {
            console.warn('AssetForm: post-create assetManufacturers', localStorage.getItem('assetManufacturers'));
            console.warn('AssetForm: post-create assetModels', localStorage.getItem('assetModels'));
          } catch (err) {
            console.warn('AssetForm: failed to read localStorage after create', err);
          }

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
                onChange={(e) => {
                  // mark manual edit when user types anything different than generated preview
                  const val = e.currentTarget.value;
                  setNameManuallyEdited(val.trim().length > 0 && val !== generatedName);
                  form.setFieldValue('name', val);
                }}
                
              />

              {/* Compact UI: no inline generated-name preview; auto-fill still applies when the user hasn't edited the name. */}
            </Grid.Col>

            {/* asset-number info removed — generation is handled server-side and not shown here */}

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
                  description={prefixDescription}
                  descriptionProps={{ component: 'div' }}
                  data={prefixOptions}
                  value={form.values.prefixId || null}
                  clearable
                  onChange={(value) => {
                    form.setFieldValue('prefixId', value ?? '');
                    if (currentUser) {
                      void setStoredPersonDefaultPrefixId(currentUser, value ?? null);
                    }
                  }}
                />
              </Grid.Col>
            )}

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Status"
                placeholder="Select status"
                required
                data={[...ASSET_STATUS_OPTIONS]}
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
              <MasterDataSelectInput
                names={locationNames}
                label="Location"
                placeholder="Select or type location"
                description="Choose from pre-defined locations or add a new one"
                value={form.values.location || ''}
                onChange={(next) => form.setFieldValue('location', next)}
                nothingFound="No locations"
                error={form.errors['location']}
                onCreateOption={(name) => {
                  const created = addLocation(name);
                  return created?.name ?? normalizeMasterDataName(name);
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <MasterDataSelectInput
                names={manufacturerNames}
                label="Manufacturer"
                placeholder="Select or type manufacturer name"
                description="Choose from existing manufacturers or add a new one"
                value={form.values.manufacturer || ''}
                onChange={(next) => form.setFieldValue('manufacturer', next)}
                nothingFound="No manufacturers"
                error={form.errors['manufacturer'] as string | undefined}
                onCreateOption={(name) => {
                  const created = addManufacturer(name);
                  return created?.name ?? normalizeMasterDataName(name);
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <MasterDataSelectInput
                names={modelNames}
                label="Model"
                placeholder="Select or type model name"
                description="Choose from existing models or add a new one"
                value={form.values.model || ''}
                onChange={(next) => form.setFieldValue('model', next)}
                nothingFound="No models"
                error={form.errors['model'] as string | undefined}
                onCreateOption={(name) => {
                  const created = addModel(name);
                  return created?.name ?? normalizeMasterDataName(name);
                }}
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

          {/* Photo Upload Section removed */}

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
