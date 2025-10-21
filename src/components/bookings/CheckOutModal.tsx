/**
 * Check-Out Modal - Modal for checking out equipment
 */

import { Modal, Stack, Button, Group, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useCheckOut } from '../../hooks/useBookings'
import type { UUID } from '../../types/entities'

interface CheckOutModalProps {
  opened: boolean
  onClose: () => void
  bookingId: UUID
  assetName: string
}

export function CheckOutModal({ opened, onClose, bookingId, assetName }: CheckOutModalProps) {
  const checkOut = useCheckOut()

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync({ bookingId })
      notifications.show({ title: 'Erfolg', message: 'Equipment ausgegeben', color: 'green' })
      onClose()
    } catch (error) {
      notifications.show({ title: 'Fehler', message: (error as Error).message, color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Equipment ausgeben">
      <Stack gap="md">
        <Text>Möchten Sie {assetName} ausgeben?</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleCheckOut} loading={checkOut.isPending} color="green">Ausgeben</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
