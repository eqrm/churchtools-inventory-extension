/**
 * Booking Approval Buttons Component (T122)
 * Allows admins to approve or reject pending bookings
 */

import { Group, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useApproveBooking, useRejectBooking } from '../../hooks/useBookings'
import type { UUID } from '../../types/entities'
import { bookingStrings } from '../../i18n/bookingStrings'

interface ApprovalButtonsProps {
  bookingId: UUID
  onApproved?: () => void
  onRejected?: () => void
}

export function ApprovalButtons({ bookingId, onApproved, onRejected }: ApprovalButtonsProps) {
  const approveMutation = useApproveBooking()
  const rejectMutation = useRejectBooking()

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(bookingId)
      notifications.show({
        title: bookingStrings.actions.approve,
        message: bookingStrings.messages.bookingApproved,
        color: 'green',
      })
      onApproved?.()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error approving booking',
        color: 'red',
      })
    }
  }

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ bookingId, reason: 'Declined by admin' })
      notifications.show({
        title: bookingStrings.actions.decline,
        message: bookingStrings.messages.bookingDeclined,
        color: 'orange',
      })
      onRejected?.()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error declining booking',
        color: 'red',
      })
    }
  }

  return (
    <Group gap="sm">
      <Button onClick={handleApprove} color="green" loading={approveMutation.isPending}>
        {bookingStrings.actions.approve}
      </Button>
      <Button onClick={handleReject} color="red" variant="subtle" loading={rejectMutation.isPending}>
        {bookingStrings.actions.decline}
      </Button>
    </Group>
  )
}
