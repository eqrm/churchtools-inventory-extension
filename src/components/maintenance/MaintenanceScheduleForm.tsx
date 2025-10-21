/**
 * MaintenanceScheduleForm component (T173)
 * Configure recurring maintenance schedules
 */

import { Button, Group, NumberInput, Select, Stack } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useCreateMaintenanceSchedule, useUpdateMaintenanceSchedule } from '../../hooks/useMaintenance';
import type { MaintenanceSchedule, MaintenanceScheduleCreate, ScheduleType } from '../../types/entities';

interface MaintenanceScheduleFormProps {
  assetId: string;
  schedule?: MaintenanceSchedule;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const scheduleTypes = [
  { value: 'time-based', label: 'Zeitbasiert (Tage/Monate/Jahre)' },
  { value: 'usage-based', label: 'Nutzungsbasiert (Betriebsstunden)' },
  { value: 'event-based', label: 'Ereignisbasiert (Anzahl Buchungen)' },
  { value: 'fixed-date', label: 'Festes Datum (Jährlich)' },
];

/**
 * Form for configuring maintenance schedules
 */
export function MaintenanceScheduleForm({ assetId, schedule, onSuccess, onCancel }: MaintenanceScheduleFormProps) {
  const createSchedule = useCreateMaintenanceSchedule();
  const updateSchedule = useUpdateMaintenanceSchedule();

  const form = useForm<{
    scheduleType: ScheduleType;
    intervalDays?: number | string;
    intervalMonths?: number | string;
    intervalYears?: number | string;
    intervalHours?: number | string;
    intervalBookings?: number | string;
    fixedDate?: Date | null;
    reminderDaysBefore: number | string;
  }>({
    initialValues: {
      scheduleType: schedule?.scheduleType || 'time-based',
      intervalDays: schedule?.intervalDays || '',
      intervalMonths: schedule?.intervalMonths || '',
      intervalYears: schedule?.intervalYears || '',
      intervalHours: schedule?.intervalHours || '',
      intervalBookings: schedule?.intervalBookings || '',
      fixedDate: schedule?.fixedDate ? new Date(schedule.fixedDate) : null,
      reminderDaysBefore: schedule?.reminderDaysBefore || 7,
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    const data: MaintenanceScheduleCreate | Partial<MaintenanceSchedule> = {
      assetId,
      scheduleType: values.scheduleType,
      reminderDaysBefore: Number(values.reminderDaysBefore),
    };

    // Add interval fields based on schedule type
    if (values.scheduleType === 'time-based') {
      if (values.intervalDays) data.intervalDays = Number(values.intervalDays);
      if (values.intervalMonths) data.intervalMonths = Number(values.intervalMonths);
      if (values.intervalYears) data.intervalYears = Number(values.intervalYears);
    } else if (values.scheduleType === 'usage-based') {
      data.intervalHours = Number(values.intervalHours);
    } else if (values.scheduleType === 'event-based') {
      data.intervalBookings = Number(values.intervalBookings);
    } else if (values.scheduleType === 'fixed-date' && values.fixedDate) {
      data.fixedDate = values.fixedDate.toISOString().split('T')[0];
    }

    try {
      if (schedule) {
        await updateSchedule.mutateAsync({ id: schedule.id, data });
        notifications.show({ title: 'Erfolg', message: 'Wartungsplan aktualisiert', color: 'green', icon: <IconCheck /> });
      } else {
        await createSchedule.mutateAsync(data as MaintenanceScheduleCreate);
        notifications.show({ title: 'Erfolg', message: 'Wartungsplan erstellt', color: 'green', icon: <IconCheck /> });
      }
      onSuccess?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Fehler beim Speichern';
      notifications.show({ title: 'Fehler', message: msg, color: 'red', icon: <IconX /> });
    }
  });

  const scheduleType = form.values.scheduleType;

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Select label="Wartungstyp" data={scheduleTypes} required {...form.getInputProps('scheduleType')} />
        
        {scheduleType === 'time-based' && (
          <>
            <NumberInput label="Tage" placeholder="z.B. 30" min={1} {...form.getInputProps('intervalDays')} />
            <NumberInput label="Monate" placeholder="z.B. 6" min={1} {...form.getInputProps('intervalMonths')} />
            <NumberInput label="Jahre" placeholder="z.B. 1" min={1} {...form.getInputProps('intervalYears')} />
          </>
        )}
        
        {scheduleType === 'usage-based' && (
          <NumberInput label="Betriebsstunden" placeholder="z.B. 100" min={1} required {...form.getInputProps('intervalHours')} />
        )}
        
        {scheduleType === 'event-based' && (
          <NumberInput label="Anzahl Buchungen" placeholder="z.B. 50" min={1} required {...form.getInputProps('intervalBookings')} />
        )}
        
        {scheduleType === 'fixed-date' && (
          <DateInput label="Datum" placeholder="Jährlich wiederkehrend" required {...form.getInputProps('fixedDate')} />
        )}

        <NumberInput label="Erinnerung (Tage vorher)" min={0} required {...form.getInputProps('reminderDaysBefore')} />

        <Group justify="flex-end" mt="md">
          {onCancel && <Button variant="subtle" onClick={onCancel}>Abbrechen</Button>}
          <Button type="submit" loading={createSchedule.isPending || updateSchedule.isPending}>
            {schedule ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
