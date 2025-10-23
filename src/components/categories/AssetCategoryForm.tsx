/* eslint-disable max-lines-per-function */
import { useEffect } from 'react';
import {
  Button,
  Group,
  Stack,
  TextInput,
  Text,
  ActionIcon,
  Paper,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';
import { CustomFieldDefinitionInput } from './CustomFieldDefinitionInput';
import { CustomFieldPreview } from './CustomFieldPreview';
import { IconPicker } from './IconPicker';
import type { AssetCategory, CategoryCreate, CustomFieldDefinition } from '../../types/entities';

interface AssetCategoryFormProps {
  category?: AssetCategory;
  initialData?: {
    name: string;
    icon?: string;
    customFields: Omit<CustomFieldDefinition, 'id'>[];
  };
  onSuccess?: (category: AssetCategory) => void;
  onCancel?: () => void;
}

export function AssetCategoryForm({ category, initialData, onSuccess, onCancel }: AssetCategoryFormProps) {
  const isEditing = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm<{
    name: string;
    icon?: string;
    customFields: CustomFieldDefinition[];
  }>({
    initialValues: {
      name: category?.name || initialData?.name || '',
      icon: category?.icon || initialData?.icon || '',
      customFields: category?.customFields || (initialData?.customFields.map((field, index) => ({
        ...field,
        id: `field-${Date.now().toString()}-${index.toString()}`,
      }))) || [],
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Category name is required';
        if (value.length < 2) return 'Category name must be at least 2 characters';
        if (value.length > 100) return 'Category name must not exceed 100 characters';
        return null;
      },
      customFields: {
        name: (value) => {
          if (!value || !value.trim()) return 'Field name is required';
          return null;
        },
      },
    },
  });

  // Update form when category prop changes
  useEffect(() => {
    if (category) {
      form.setValues({
        name: category.name,
        icon: category.icon || '',
        customFields: category.customFields,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (isEditing) {
        const updated = await updateCategory.mutateAsync({
          id: category.id,
          data: {
            name: values.name,
            icon: values.icon || undefined,
            customFields: values.customFields,
          },
        });
        notifications.show({
          title: 'Success',
          message: `Category "${updated.name}" has been updated`,
          color: 'green',
        });
        onSuccess?.(updated);
      } else {
        const categoryData: CategoryCreate = {
          name: values.name,
          icon: values.icon || undefined,
          customFields: values.customFields,
        };
        const created = await createCategory.mutateAsync(categoryData);
        notifications.show({
          title: 'Success',
          message: `Category "${created.name}" has been created`,
          color: 'green',
        });
        form.reset();
        onSuccess?.(created);
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to save category',
        color: 'red',
      });
    }
  };

  const addCustomField = () => {
    const newField: CustomFieldDefinition = {
      id: `temp-${String(Date.now())}`,
      name: '',
      type: 'text',
      required: false,
    };
    form.insertListItem('customFields', newField);
  };

  const removeCustomField = (index: number) => {
    form.removeListItem('customFields', index);
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Category Name"
          placeholder="e.g., Sound Equipment, Cameras, Microphones"
          required
          {...form.getInputProps('name')}
          disabled={isPending}
        />

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Icon
          </Text>
          <IconPicker
            value={form.values.icon}
            onChange={(value) => {
              form.setFieldValue('icon', value);
            }}
            disabled={isPending}
          />
          <Text size="xs" c="dimmed">
            Optional icon to represent this category
          </Text>
        </Stack>

        <Divider label="Custom Fields" labelPosition="left" />

        <Text size="sm" c="dimmed">
          Define custom fields that will be available for all assets in this category.
        </Text>

        <Stack gap="md">
          {form.values.customFields.map((field, index) => (
            <Paper key={field.id} withBorder p="md" pos="relative">
              <ActionIcon
                color="red"
                variant="subtle"
                size="sm"
                pos="absolute"
                top={8}
                right={8}
                onClick={() => {
                  removeCustomField(index);
                }}
                disabled={isPending}
              >
                <IconTrash size={16} />
              </ActionIcon>

              <CustomFieldDefinitionInput
                value={field}
                onChange={(updated: CustomFieldDefinition) => {
                  form.setFieldValue(`customFields.${String(index)}`, updated);
                }}
                disabled={isPending}
              />
            </Paper>
          ))}

          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={addCustomField}
            disabled={isPending}
          >
            Add Custom Field
          </Button>
        </Stack>

        {form.values.customFields.length > 0 && (
          <>
            <Divider label="Preview" labelPosition="left" mt="xl" />
            <CustomFieldPreview fields={form.values.customFields} />
          </>
        )}

        <Group justify="flex-end" mt="xl">
          {onCancel && (
            <Button variant="default" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={isPending}>
            {isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
