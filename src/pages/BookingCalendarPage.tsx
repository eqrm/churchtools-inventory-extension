/**
 * Booking Calendar Page - Calendar view of all bookings
 */

import { Stack, Title } from '@mantine/core'
import { BookingCalendar } from '../components/bookings/BookingCalendar'

export function BookingCalendarPage() {
  const handleDateClick = (date: Date) => {
    // Future: Could filter bookings by date or open create modal
    console.warn('Date clicked:', date)
  }

  return (
    <Stack gap="md">
      <Title order={2}>Buchungskalender</Title>
      <BookingCalendar onDateClick={handleDateClick} />
    </Stack>
  )
}
