/**
 * MaintenanceRecordForm component (T172)
 * Form for recording completed maintenance
 */

import { Button, Group, NumberInput, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useCreateMaintenanceRecord, useMaintenanceSchedule, useUpdateMaintenanceSchedule } from '../../hooks/useMaintenance';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { calculateNextDue } from '../../utils/maintenanceCalculations';
import type { MaintenanceRecordCreate, MaintenanceType } from '../../types/entities';

interface MaintenanceRecordFormProps {
  assetId: string;
  assetNumber: string;
  assetName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const maintenanceTypes = [
  { value: 'inspection', label: 'Inspektion' },
  { value: 'cleaning', label: 'Reinigung' },
  { value: 'repair', label: 'Reparatur' },
  { value: 'calibration', label: 'Kalibrierung' },
  { value: 'testing', label: 'Prüfung' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Sonstiges' },
];

/**
 * Form for recording completed maintenance
 */
export function MaintenanceRecordForm({
  assetId,
  assetNumber,
  assetName,
  onSuccess,
  onCancel,
}: MaintenanceRecordFormProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: schedule } = useMaintenanceSchedule(assetId);
  const createRecord = useCreateMaintenanceRecord();
  const updateSchedule = useUpdateMaintenanceSchedule();

  const form = useForm<{
    type: MaintenanceType;
    date: Date;
    description: string;
    notes: string;
    cost: number | string;
  }>({
    initialValues: {
      type: 'inspection',
      date: new Date(),
      description: '',
      notes: '',
      cost: '',
    },
    validate: {
      description: (value) => (value.trim() ? null : 'Beschreibung erforderlich'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (!currentUser) {
      notifications.show({
        title: 'Fehler',
        message: 'Benutzer nicht gefunden',
        color: 'red',
        icon: <IconX />,
      });
      return;
    }

    const dateStr = values.date.toISOString().split('T')[0];
    if (!dateStr) return;

    const recordData: MaintenanceRecordCreate = {
      asset: { id: assetId, assetNumber, name: assetName },
      type: values.type,
      date: dateStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      description: values.description,
      notes: values.notes || undefined,
      cost: values.cost ? Number(values.cost) : undefined,
    };

    try {
      await createRecord.mutateAsync(recordData);
      
      // T184: Automatically update next due date if schedule exists
      if (schedule) {
        const nextDue = calculateNextDue(schedule, dateStr);
        if (nextDue) {
          await updateSchedule.mutateAsync({
            id: schedule.id,
            data: { nextDue },
          });
        }
      }
      
      notifications.show({ title: 'Erfolg', message: 'Wartung erfasst', color: 'green', icon: <IconCheck /> });
      form.reset();
      onSuccess?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Fehler beim Speichern';
      notifications.show({ title: 'Fehler', message: msg, color: 'red', icon: <IconX /> });
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Select label="Wartungstyp" data={maintenanceTypes} required {...form.getInputProps('type')} />
        <DateInput label="Datum" required {...form.getInputProps('date')} />
        <TextInput label="Beschreibung" placeholder="z.B. Jährliche Sicherheitsprüfung" required {...form.getInputProps('description')} />
        <Textarea label="Notizen" placeholder="Zusätzliche Anmerkungen..." minRows={3} {...form.getInputProps('notes')} />
        <NumberInput label="Kosten (€)" placeholder="0.00" decimalScale={2} min={0} {...form.getInputProps('cost')} />
        <Group justify="flex-end" mt="md">
          {onCancel && <Button variant="subtle" onClick={onCancel}>Abbrechen</Button>}
          <Button type="submit" loading={createRecord.isPending}>Wartung erfassen</Button>
        </Group>
      </Stack>
    </form>
  );
}
