import { Box, Button, Group, Stack, Text, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck } from '@tabler/icons-react';
import { useCreateStockTakeSession } from '../../hooks/useStockTake';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { StockTakeSessionCreate } from '../../types/entities';

interface StartStockTakeFormProps {
  onSuccess?: (sessionId: string) => void;
  onCancel?: () => void;
}

/**
 * StartStockTakeForm component - Start new stock take session (T152)
 * Enhanced for E6: Simplified to just create session (T277)
 */
export function StartStockTakeForm({ onSuccess, onCancel }: StartStockTakeFormProps) {
  const { data: currentUser } = useCurrentUser();
  const createSession = useCreateStockTakeSession();

  const form = useForm<{ notes: string }>({
    initialValues: { notes: '' },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (!currentUser) return;

    const sessionData: StockTakeSessionCreate = {
      startDate: new Date().toISOString(),
      status: 'active',
      scope: { type: 'all' },
      conductedBy: currentUser.id,
      conductedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      notes: values.notes || undefined,
    };

    const session = await createSession.mutateAsync(sessionData);
    onSuccess?.(session.id);
  });

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Title order={3}>Start New Stock Take</Title>
          <Text size="sm" c="dimmed">
            You can update asset fields during scanning in the next step.
          </Text>
          <Textarea
            label="Notes"
            placeholder="Purpose of stock take..."
            {...form.getInputProps('notes')}
          />
          <Group justify="flex-end">
            {onCancel && <Button variant="subtle" onClick={onCancel}>Cancel</Button>}
            <Button type="submit" leftSection={<IconCheck size={16} />}>
              Start
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
