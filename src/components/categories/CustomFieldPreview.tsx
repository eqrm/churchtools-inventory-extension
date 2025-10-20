import { Paper, Stack, Text, Badge, Group, Divider } from '@mantine/core';
import { CustomFieldInput } from '../assets/CustomFieldInput';
import type { CustomFieldDefinition } from '../../types/entities';

interface CustomFieldPreviewProps {
  fields: CustomFieldDefinition[];
}

export function CustomFieldPreview({ fields }: CustomFieldPreviewProps) {
  if (fields.length === 0) {
    return (
      <Paper withBorder p="md" bg="gray.0">
        <Text size="sm" c="dimmed" ta="center">
          No custom fields defined yet. Add fields above to see a preview.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder p="md" bg="gray.0">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" fw={600} c="dimmed">
            Preview: How fields will appear in Asset Form
          </Text>
          <Badge size="sm" variant="light">
            Preview Only
          </Badge>
        </Group>

        <Divider />

        <Stack gap="md">
          {fields.map((field) => (
            <div key={field.id}>
              <CustomFieldInput
                field={field}
                value={undefined}
                onChange={() => {
                  // Preview only - no-op
                }}
                disabled
              />
            </div>
          ))}
        </Stack>

        <Text size="xs" c="dimmed" ta="center" mt="xs">
          ℹ️ This is a preview. Fields will be editable when creating/editing assets.
        </Text>
      </Stack>
    </Paper>
  );
}
