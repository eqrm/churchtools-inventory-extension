/**
 * Booking Approval Buttons Component (T122)
 * Allows admins to approve or reject pending bookings
 */

import { Group, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useApproveBooking, useRejectBooking } from '../../hooks/useBookings'
import type { UUID } from '../../types/entities'

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
        title: 'Genehmigt',
        message: 'Buchung wurde genehmigt',
        color: 'green',
      })
      onApproved?.()
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error instanceof Error ? error.message : 'Fehler beim Genehmigen',
        color: 'red',
      })
    }
  }

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ bookingId, reason: 'Abgelehnt durch Admin' })
      notifications.show({
        title: 'Abgelehnt',
        message: 'Buchung wurde abgelehnt',
        color: 'orange',
      })
      onRejected?.()
    } catch (error) {
      notifications.show({
        title: 'Fehler',
        message: error instanceof Error ? error.message : 'Fehler beim Ablehnen',
        color: 'red',
      })
    }
  }

  return (
    <Group gap="sm">
      <Button onClick={handleApprove} color="green" loading={approveMutation.isPending}>
        Genehmigen
      </Button>
      <Button onClick={handleReject} color="red" variant="subtle" loading={rejectMutation.isPending}>
        Ablehnen
      </Button>
    </Group>
  )
}
