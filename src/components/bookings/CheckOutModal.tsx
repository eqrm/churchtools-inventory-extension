/**
 * Check-Out Modal - Modal for checking out equipment
 */

import { Modal, Stack, Button, Group, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useCheckOut } from '../../hooks/useBookings'
import type { UUID } from '../../types/entities'
import { bookingStrings } from '../../i18n/bookingStrings'

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
      notifications.show({ title: 'Success', message: bookingStrings.messages.equipmentIssued, color: 'green' })
      onClose()
    } catch (error) {
      notifications.show({ title: 'Error', message: (error as Error).message, color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={bookingStrings.actions.issue}>
      <Stack gap="md">
        <Text>Do you want to check out {assetName}?</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCheckOut} loading={checkOut.isPending} color="green">{bookingStrings.actions.issue}</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
