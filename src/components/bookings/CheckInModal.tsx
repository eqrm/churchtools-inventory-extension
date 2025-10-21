/**
 * Check-In Modal - Modal for checking in equipment with condition assessment
 */

import { Modal, Stack, Button, Group, Select, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCheckIn } from '../../hooks/useBookings'
import type { UUID, ConditionAssessment } from '../../types/entities'

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
      notifications.show({ title: 'Erfolg', message: 'Equipment zurückgegeben', color: 'green' })
      onClose()
    } catch (error) {
      notifications.show({ title: 'Fehler', message: (error as Error).message, color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Equipment zurückgeben: ${assetName}`}>
      <form onSubmit={form.onSubmit(handleCheckIn)}>
        <Stack gap="md">
          <Select
            label="Zustand"
            data={[
              { value: 'excellent', label: 'Ausgezeichnet' },
              { value: 'good', label: 'Gut' },
              { value: 'fair', label: 'Akzeptabel' },
              { value: 'poor', label: 'Schlecht' },
              { value: 'damaged', label: 'Beschädigt' },
            ]}
            {...form.getInputProps('rating')}
            required
          />
          <Textarea label="Notizen" placeholder="Beschädigungen oder Anmerkungen..." {...form.getInputProps('notes')} rows={3} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" loading={checkIn.isPending} color="blue">Zurückgeben</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
