/**
 * Check-In Modal - Modal for checking in equipment with condition assessment
 */

import { Modal, Stack, Button, Group, Select, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCheckIn } from '../../hooks/useBookings'
import type { UUID, ConditionAssessment } from '../../types/entities'
import { bookingStrings } from '../../i18n/bookingStrings'

interface CheckInModalProps {
  opened: boolean
  onClose: () => void
  bookingId: UUID
  assetName: string
}

export function CheckInModal({ opened, onClose, bookingId, assetName }: CheckInModalProps) {
  const checkIn = useCheckIn()

  const form = useForm<ConditionAssessment>({
    initialValues: {
      rating: 'good',
      notes: '',
      photos: [],
    },
  })

  const handleCheckIn = async (values: ConditionAssessment) => {
    try {
      await checkIn.mutateAsync({ bookingId, condition: values })
      notifications.show({ title: 'Success', message: bookingStrings.messages.equipmentReturned, color: 'green' })
      onClose()
    } catch (error) {
      notifications.show({ title: 'Error', message: (error as Error).message, color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`${bookingStrings.actions.return}: ${assetName}`}>
      <form onSubmit={form.onSubmit(handleCheckIn)}>
        <Stack gap="md">
          <Select
            label="Condition"
            data={[
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' },
              { value: 'damaged', label: 'Damaged' },
            ]}
            {...form.getInputProps('rating')}
            required
          />
          <Textarea label="Notes" placeholder="Damage or comments..." {...form.getInputProps('notes')} rows={3} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={checkIn.isPending} color="blue">{bookingStrings.actions.return}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
