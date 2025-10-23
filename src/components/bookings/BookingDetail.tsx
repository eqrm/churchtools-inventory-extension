/**
 * Booking Detail Component - Shows full booking information
 */

import { useParams } from 'react-router-dom'
import { Stack, Title, Text, Group, Button, Card, Paper, Skeleton } from '@mantine/core'
import { useBooking } from '../../hooks/useBookings'
import { BookingStatusBadge } from './BookingStatusBadge'

interface BookingDetailProps {
  bookingId?: string
  onEdit?: () => void
  onCheckOut?: () => void
  onCheckIn?: () => void
  onCancel?: () => void
}

export function BookingDetail({ bookingId: propId, onEdit, onCheckOut, onCheckIn, onCancel }: BookingDetailProps) {
  const { id: paramId } = useParams<{ id: string }>()
  const bookingId = propId || paramId || ''
  const { data: booking, isLoading } = useBooking(bookingId)

  if (isLoading) {
    return (
      <Stack gap="md">
        <Group justify="space-between">
          <Skeleton height={32} width={200} />
          <Skeleton height={28} width={100} />
        </Group>
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Skeleton height={20} width={150} />
            <Skeleton height={20} width="100%" />
            <Skeleton height={20} width={180} />
            <Skeleton height={20} width="100%" />
            <Skeleton height={20} width={160} />
            <Skeleton height={20} width="100%" />
          </Stack>
        </Paper>
      </Stack>
    )
  }

  if (!booking) return <Text c="red">Buchung nicht gefunden</Text>

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Buchungsdetails</Title>
        <BookingStatusBadge status={booking.status} />
      </Group>

      <Card>
        <Stack gap="sm">
          {booking.asset && (
            <div><Text fw={500}>Asset:</Text><Text>{booking.asset.assetNumber} - {booking.asset.name}</Text></div>
          )}
          {booking.kit && (
            <div><Text fw={500}>Equipment-Kit:</Text><Text>{booking.kit.name}</Text></div>
          )}
          <div><Text fw={500}>Zeitraum:</Text><Text>{new Date(booking.startDate).toLocaleDateString('de-DE')} - {new Date(booking.endDate).toLocaleDateString('de-DE')}</Text></div>
          <div><Text fw={500}>Zweck:</Text><Text>{booking.purpose}</Text></div>
          {booking.notes && <div><Text fw={500}>Notizen:</Text><Text>{booking.notes}</Text></div>}
          <div><Text fw={500}>Angefordert von:</Text><Text>{booking.requestedByName}</Text></div>
          {booking.approvedByName && <div><Text fw={500}>Genehmigt von:</Text><Text>{booking.approvedByName}</Text></div>}
        </Stack>
      </Card>

      <Group>
        {onEdit && <Button onClick={onEdit}>Bearbeiten</Button>}
        {onCheckOut && booking.status === 'approved' && <Button onClick={onCheckOut} color="green">Ausgeben</Button>}
        {onCheckIn && booking.status === 'active' && <Button onClick={onCheckIn} color="blue">Rückgabe</Button>}
        {onCancel && ['pending', 'approved'].includes(booking.status) && <Button onClick={onCancel} color="red" variant="subtle">Stornieren</Button>}
      </Group>
    </Stack>
  )
}
