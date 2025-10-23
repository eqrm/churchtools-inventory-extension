import { TextInput, Switch, Stack, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { SavedViewCreate, ViewMode, ViewFilter } from '../../types/entities';
import { useCreateSavedView, useUpdateSavedView } from '../../hooks/useSavedViews';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface SavedViewFormProps {
  viewMode: ViewMode;
  filters: ViewFilter[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  groupBy?: string;
  visibleColumns?: string[];
  existingViewId?: string;
  existingViewName?: string;
  existingIsPublic?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Form for saving current view configuration as a named view
 */
export function SavedViewForm({
  viewMode,
  filters,
  sortBy,
  sortDirection,
  groupBy,
  visibleColumns,
  existingViewId,
  existingViewName,
  existingIsPublic,
  onSuccess,
  onCancel,
}: SavedViewFormProps) {
  const { data: currentUser } = useCurrentUser();
  const createMutation = useCreateSavedView();
  const updateMutation = useUpdateSavedView();

  const form = useForm({
    initialValues: {
      name: existingViewName || '',
      isPublic: existingIsPublic ?? false,
    },
    validate: {
      name: (value) => (!value ? 'Name ist erforderlich' : null),
    },
  });

  const handleSubmit = async (values: { name: string; isPublic: boolean }) => {
    if (!currentUser) return;

    const viewData: SavedViewCreate = {
      name: values.name,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      isPublic: values.isPublic,
      viewMode,
      filters,
      sortBy,
      sortDirection,
      groupBy,
      visibleColumns,
    };

    try {
      if (existingViewId) {
        await updateMutation.mutateAsync({ id: existingViewId, updates: viewData });
      } else {
        await createMutation.mutateAsync(viewData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save view:', error);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Ansichtsname"
          placeholder="z.B. Verfügbare Audio-Geräte"
          required
          {...form.getInputProps('name')}
        />

        <Switch
          label="Öffentliche Ansicht"
          description="Andere Benutzer können diese Ansicht sehen und verwenden"
          {...form.getInputProps('isPublic', { type: 'checkbox' })}
        />

        <Group justify="flex-end" gap="sm">
          {onCancel && (
            <Button variant="default" onClick={onCancel}>
              Abbrechen
            </Button>
          )}
          <Button
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {existingViewId ? 'Aktualisieren' : 'Speichern'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
