/**
 * BookingForm Component
 * 
 * Form for creating and editing equipment bookings.
 * Supports both individual asset bookings and kit bookings.
 */

import { useForm } from '@mantine/form'
import { Stack, TextInput, Textarea, Select, Button, Group } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useAssets } from '../../hooks/useAssets'
import { useKits } from '../../hooks/useKits'
import { useCreateBooking, useUpdateBooking } from '../../hooks/useBookings'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import type { Booking, BookingCreate } from '../../types/entities'

interface BookingFormProps {
  booking?: Booking
  kitId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function BookingForm({ booking, kitId, onSuccess, onCancel }: BookingFormProps) {
  const { data: assets } = useAssets({ status: 'available' })
  const { data: kits } = useKits()
  const { data: currentUser } = useCurrentUser()
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()

  const form = useForm<BookingCreate>({
    initialValues: booking ? {
      asset: booking.asset,
      kit: booking.kit,
      startDate: booking.startDate,
      endDate: booking.endDate,
      purpose: booking.purpose,
      notes: booking.notes,
      requestedBy: booking.requestedBy,
      requestedByName: booking.requestedByName,
    } : {
      kit: kitId ? { id: kitId, name: kits?.find(k => k.id === kitId)?.name || '' } : undefined,
      startDate: '',
      endDate: '',
      purpose: '',
      requestedBy: currentUser?.id || '',
      requestedByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    },
  })

  const handleSubmit = async (values: BookingCreate) => {
    try {
      const action = booking 
        ? updateBooking.mutateAsync({ id: booking.id, data: values })
        : createBooking.mutateAsync(values)
      await action
      notifications.show({ 
        title: 'Erfolg', 
        message: booking ? 'Buchung aktualisiert' : 'Buchung erstellt', 
        color: 'green' 
      })
      onSuccess?.()
    } catch (error) {
      notifications.show({ title: 'Fehler', message: (error as Error).message, color: 'red' })
    }
  }

  const assetOptions = assets?.map(a => ({ value: a.id, label: `${a.assetNumber} - ${a.name}` })) || []
  const kitOptions = kits?.map(k => ({ value: k.id, label: k.name })) || []

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {!kitId && (
          <>
            <Select
              label="Asset (optional)"
              placeholder="Asset auswählen"
              data={assetOptions}
              value={form.values.asset?.id}
              onChange={(value) => {
                const asset = assets?.find(a => a.id === value)
                if (asset) form.setFieldValue('asset', { id: asset.id, assetNumber: asset.assetNumber, name: asset.name })
                else form.setFieldValue('asset', undefined)
              }}
              searchable
              clearable
            />
            <Select
              label="Kit (optional)"
              placeholder="Kit auswählen"
              data={kitOptions}
              value={form.values.kit?.id}
              onChange={(value) => {
                const kit = kits?.find(k => k.id === value)
                if (kit) form.setFieldValue('kit', { id: kit.id, name: kit.name })
                else form.setFieldValue('kit', undefined)
              }}
              searchable
              clearable
            />
          </>
        )}
        <DatePickerInput
          type="range"
          label="Zeitraum"
          value={[
            form.values.startDate ? new Date(form.values.startDate) : null,
            form.values.endDate ? new Date(form.values.endDate) : null,
          ]}
          onChange={(dates) => {
            const [start, end] = dates
            const startDate = start?.toISOString().split('T')[0] || ''
            const endDate = end?.toISOString().split('T')[0] || ''
            if (startDate) form.setFieldValue('startDate', startDate)
            if (endDate) form.setFieldValue('endDate', endDate)
          }}
          required
        />
        <TextInput label="Zweck" {...form.getInputProps('purpose')} required />
        <Textarea label="Notizen" {...form.getInputProps('notes')} rows={3} />
        <Group justify="flex-end">
          {onCancel && <Button variant="subtle" onClick={onCancel}>Abbrechen</Button>}
          <Button type="submit" loading={createBooking.isPending || updateBooking.isPending}>
            {booking ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
