/**
 * Booking Calendar Page - Calendar view of all bookings
 */

import { Stack, Title } from '@mantine/core'
import { BookingCalendar } from '../components/bookings/BookingCalendar'

export function BookingCalendarPage() {
  return (
    <Stack gap="md">
      <Title order={2}>Buchungskalender</Title>
      <BookingCalendar />
    </Stack>
  )
}
