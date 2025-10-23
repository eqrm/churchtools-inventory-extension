import { useForm } from '@mantine/form';
import {
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  ColorPicker,
  Text,
  Badge,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { AssetPrefix, AssetPrefixCreate } from '../../types/entities';

interface AssetPrefixFormProps {
  prefix?: AssetPrefix;
  onSubmit: (data: AssetPrefixCreate) => Promise<void>;
  onCancel: () => void;
  existingPrefixes?: string[];
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export function AssetPrefixForm({
  prefix,
  onSubmit,
  onCancel,
  existingPrefixes = [],
}: AssetPrefixFormProps) {
  const form = useForm({
    initialValues: {
      prefix: prefix?.prefix || '',
      description: prefix?.description || '',
      color: prefix?.color || DEFAULT_COLORS[0],
    },
    validate: {
      prefix: (value) => {
        if (!value) return 'Prefix is required';
        if (!/^[A-Z]{2,5}$/.test(value)) {
          return 'Prefix must be 2-5 uppercase letters (e.g., CAM, AUD)';
        }
        if (existingPrefixes.includes(value)) {
          return 'This prefix already exists';
        }
        return null;
      },
      description: (value) => {
        if (!value) return 'Description is required';
        if (value.length < 3) return 'Description must be at least 3 characters';
        return null;
      },
      color: (value) => {
        if (!value) return 'Color is required';
        if (!/^#[0-9A-F]{6}$/i.test(value)) {
          return 'Invalid color format (must be hex color like #3B82F6)';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    // Ensure color has a value before submitting
    if (!values.color) {
      form.setFieldError('color', 'Color is required');
      return;
    }
    await onSubmit({
      prefix: values.prefix,
      description: values.description,
      color: values.color,
    });
  };

  const nextAssetNumber = `${form.values.prefix || 'XXX'}-001`;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Prefix"
          placeholder="CAM"
          description="2-5 uppercase letters (e.g., CAM for cameras, AUD for audio)"
          required
          {...form.getInputProps('prefix')}
          disabled={!!prefix} // Can't change prefix after creation
          style={{ textTransform: 'uppercase' }}
        />

        <Textarea
          label="Description"
          placeholder="Camera Equipment"
          description="Brief description of what this prefix is used for"
          required
          minRows={2}
          {...form.getInputProps('description')}
        />

        <div>
          <Text size="sm" fw={500} mb={8}>
            Color <span style={{ color: 'red' }}>*</span>
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Choose a color to visually distinguish this prefix
          </Text>
          <Group gap="xs" mb="md">
            {DEFAULT_COLORS.map((color) => (
              <Button
                key={color}
                variant={form.values.color === color ? 'filled' : 'outline'}
                color={color}
                size="xs"
                onClick={() => form.setFieldValue('color', color)}
                style={{
                  width: 40,
                  height: 40,
                  padding: 0,
                  backgroundColor: color,
                  borderColor: color,
                }}
              />
            ))}
          </Group>
          <ColorPicker
            format="hex"
            value={form.values.color}
            onChange={(value) => form.setFieldValue('color', value)}
            fullWidth
          />
          {form.errors['color'] && (
            <Text size="xs" c="red" mt={4}>
              {form.errors['color']}
            </Text>
          )}
        </div>

        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Preview
            </Text>
            <Group>
              <Badge color={form.values.color} size="lg" variant="filled">
                {form.values.prefix || 'XXX'}
              </Badge>
              <Text size="sm" c="dimmed">
                Next asset number: {nextAssetNumber}
              </Text>
            </Group>
          </Stack>
        </Alert>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {prefix ? 'Update' : 'Create'} Prefix
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
