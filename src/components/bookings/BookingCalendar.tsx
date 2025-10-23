/**
 * Booking Calendar Component - Calendar view with filtering (T127)
 * Note: Full calendar integration requires Mantine DatePicker/Calendar API updates
 */

import { Stack, Select, Group, Text } from '@mantine/core'
import { useState, memo } from 'react' // T216: Add memo for performance
import { useBookings } from '../../hooks/useBookings'
import type { BookingStatus } from '../../types/entities'

interface BookingCalendarProps {
  onDateClick?: (date: Date) => void
}

function BookingCalendarComponent({ onDateClick: _onDateClick }: BookingCalendarProps) {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | null>(null)

  const { data: bookings = [] } = useBookings({
    status: statusFilter || undefined,
  })

  return (
    <Stack gap="md">
      <Group>
        <Select
          placeholder="Status filtern"
          data={[
            { value: 'pending', label: 'Ausstehend' },
            { value: 'approved', label: 'Genehmigt' },
            { value: 'active', label: 'Aktiv' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as BookingStatus)}
          clearable
          style={{ width: 200 }}
        />
      </Group>
      <Text size="sm" c="dimmed">
        Kalenderansicht mit {bookings.length} Buchungen
        (Vollständige Kalenderintegration folgt)
      </Text>
    </Stack>
  )
}

/**
 * T216: Memoized BookingCalendar to prevent unnecessary re-renders
 * Only re-renders when onDateClick callback changes
 */
export const BookingCalendar = memo(BookingCalendarComponent);
