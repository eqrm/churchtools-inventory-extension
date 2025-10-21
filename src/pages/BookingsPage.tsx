/**
 * Bookings Page - Lists all equipment bookings
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Title, Button, Modal } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { BookingList } from '../components/bookings/BookingList'
import { BookingForm } from '../components/bookings/BookingForm'

export function BookingsPage() {
  const navigate = useNavigate()
  const [createModalOpened, setCreateModalOpened] = useState(false)

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Title order={2}>Buchungen</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          Neue Buchung
        </Button>
      </Stack>

      <BookingList
        onBookingClick={(id) => navigate(`/bookings/${id}`)}
        onCreateClick={() => setCreateModalOpened(true)}
      />

      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Neue Buchung erstellen"
        size="lg"
      >
        <BookingForm
          onSuccess={() => setCreateModalOpened(false)}
          onCancel={() => setCreateModalOpened(false)}
        />
      </Modal>
    </Stack>
  )
}
