/**
 * Booking Detail Component - Shows full booking information
 */

import { useParams } from 'react-router-dom'
import { Stack, Title, Text, Group, Button, Card, Paper, Skeleton } from '@mantine/core'
import { useBooking } from '../../hooks/useBookings'
import { BookingStatusBadge } from './BookingStatusBadge'
import { PersonDisplay } from '../common/PersonDisplay'
import type { Booking } from '../../types/entities'
import { bookingStrings } from '../../i18n/bookingStrings'

interface BookingDetailProps {
  bookingId?: string
  onEdit?: () => void
  onCheckOut?: () => void
  onCheckIn?: () => void
  onCancel?: () => void
}

function BookingDetailSkeleton() {
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
  );
}

function BookingDetailsCard({ booking }: { booking: Booking }) {
  return (
    <Card>
      <Stack gap="sm">
        {booking.asset && (
          <div><Text fw={500}>Asset:</Text><Text>{booking.asset.assetNumber} - {booking.asset.name}</Text></div>
        )}
        {booking.kit && (
          <div><Text fw={500}>{bookingStrings.labels.equipmentKit}:</Text><Text>{booking.kit.name}</Text></div>
        )}
        <div><Text fw={500}>Date Range:</Text><Text>{new Date(booking.startDate).toLocaleDateString('en-US')} - {new Date(booking.endDate).toLocaleDateString('en-US')}</Text></div>
        <div><Text fw={500}>Purpose:</Text><Text>{booking.purpose}</Text></div>
        {booking.notes && <div><Text fw={500}>Notes:</Text><Text>{booking.notes}</Text></div>}
        
        {/* T052: Show both booker and recipient */}
        <div>
          <Text fw={500}>Booked By:</Text>
          <PersonDisplay 
            personId={booking.bookedById} 
            personName={booking.bookedByName || booking.requestedByName} 
          />
        </div>
        <div>
          <Text fw={500}>Booked For:</Text>
          <PersonDisplay 
            personId={booking.bookingForId} 
            personName={booking.bookingForName} 
          />
        </div>
        
        {booking.approvedByName && (
          <div>
            <Text fw={500}>{bookingStrings.labels.approvedBy}:</Text>
            <PersonDisplay personName={booking.approvedByName} />
          </div>
        )}
      </Stack>
    </Card>
  );
}

export function BookingDetail({ bookingId: propId, onEdit, onCheckOut, onCheckIn, onCancel }: BookingDetailProps) {
  const { id: paramId } = useParams<{ id: string }>()
  const bookingId = propId || paramId || ''
  const { data: booking, isLoading } = useBooking(bookingId)

  if (isLoading) return <BookingDetailSkeleton />;
  if (!booking) return <Text c="red">{bookingStrings.messages.bookingNotFound}</Text>

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{bookingStrings.labels.bookingDetails}</Title>
        <BookingStatusBadge status={booking.status} />
      </Group>

      <BookingDetailsCard booking={booking} />

      <Group>
        {onEdit && <Button onClick={onEdit}>Edit</Button>}
        {onCheckOut && booking.status === 'approved' && <Button onClick={onCheckOut} color="green">Check Out</Button>}
        {onCheckIn && booking.status === 'active' && <Button onClick={onCheckIn} color="blue">Check In</Button>}
        {onCancel && ['pending', 'approved'].includes(booking.status) && <Button onClick={onCancel} color="red" variant="subtle">Cancel</Button>}
      </Group>
    </Stack>
  )
}
