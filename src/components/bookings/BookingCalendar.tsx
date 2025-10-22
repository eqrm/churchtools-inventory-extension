/**
 * Booking Calendar Component - Calendar view with filtering (T127)
 */

import { Stack, Select, Group } from '@mantine/core'
import { useState, memo } from 'react' // T216: Add memo for performance
import { useBookings } from '../../hooks/useBookings'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { BookingStatus } from '../../types/entities'
import { bookingStrings } from '../../i18n/bookingStrings'
import { bookingStatusColors } from '../../theme'
import type { EventClickArg } from '@fullcalendar/core'

interface BookingCalendarProps {
  onBookingClick?: (bookingId: string) => void
}

function BookingCalendarComponent({ onBookingClick }: BookingCalendarProps) {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | null>(null)

  const { data: bookings = [] } = useBookings({
    status: statusFilter || undefined,
  })

  // T121: Map booking statuses to event colors
  const getEventColor = (status: BookingStatus): string => {
    switch (status) {
      case 'approved': return bookingStatusColors.approved
      case 'pending': return bookingStatusColors.pending
      case 'active': return bookingStatusColors.active
      case 'declined': return 'red' // Declined bookings are red
      case 'cancelled': return bookingStatusColors.cancelled
      case 'completed': return bookingStatusColors.completed
      case 'overdue': return bookingStatusColors.overdue
      default: return 'gray'
    }
  }

  // T122: Display bookings on calendar with date ranges
  const events = bookings.map(booking => {
    const startDate = booking.bookingMode === 'single-day' ? booking.date : booking.startDate
    const endDate = booking.bookingMode === 'single-day' ? booking.date : booking.endDate

    return {
      id: booking.id,
      title: `${booking.asset?.name || 'Unknown Asset'} - ${booking.bookingForName}`,
      start: startDate,
      end: endDate,
      backgroundColor: getEventColor(booking.status),
      borderColor: getEventColor(booking.status),
      textColor: 'white',
      extendedProps: {
        booking,
      },
    }
  })

  // T123: Add click handler to calendar events
  const handleEventClick = (arg: EventClickArg) => {
    if (onBookingClick) {
      onBookingClick(arg.event.id)
    }
  }

  return (
    <Stack gap="md">
      <Group>
        <Select
          placeholder="Filter by status"
          data={[
            { value: 'pending', label: bookingStrings.status.pending },
            { value: 'approved', label: bookingStrings.status.approved },
            { value: 'active', label: bookingStrings.status.active },
            { value: 'declined', label: bookingStrings.status.declined },
            { value: 'cancelled', label: bookingStrings.status.cancelled },
            { value: 'completed', label: bookingStrings.status.completed },
            { value: 'overdue', label: bookingStrings.status.overdue },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as BookingStatus)}
          clearable
          style={{ width: 200 }}
        />
      </Group>

      {/* T119-T120: Create calendar with ChurchTools theme colors */}
      <div style={{ height: '600px' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="dayGridMonth"
          events={events}
          eventClick={handleEventClick}
          height="100%"
          themeSystem="standard"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </div>
    </Stack>
  )
}

/**
 * T216: Memoized BookingCalendar to prevent unnecessary re-renders
 * Only re-renders when onBookingClick callback changes
 */
export const BookingCalendar = memo(BookingCalendarComponent);
