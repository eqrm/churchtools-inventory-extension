/**
 * Condition Assessment Component - Basic version without photo upload
 */

import { Stack, Select, Textarea, Title } from '@mantine/core'
import { bookingStrings } from '../../i18n/bookingStrings'

interface ConditionAssessmentProps {
  rating?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  notes?: string
  onRatingChange?: (rating: string) => void
  onNotesChange?: (notes: string) => void
  readOnly?: boolean
}

export function ConditionAssessment({
  rating = 'good',
  notes = '',
  onRatingChange,
  onNotesChange,
  readOnly = false,
}: ConditionAssessmentProps) {
  return (
    <Stack gap="md">
      <Title order={4}>{bookingStrings.condition.title}</Title>
      <Select
        label={bookingStrings.condition.rating}
        data={[
          { value: 'excellent', label: bookingStrings.condition.excellent },
          { value: 'good', label: bookingStrings.condition.good },
          { value: 'fair', label: bookingStrings.condition.fair },
          { value: 'poor', label: bookingStrings.condition.poor },
          { value: 'damaged', label: bookingStrings.condition.damaged },
        ]}
        value={rating}
        onChange={(value) => onRatingChange?.(value || 'good')}
        disabled={readOnly}
      />
      <Textarea
        label={bookingStrings.condition.notes}
        placeholder={bookingStrings.condition.notesPlaceholder}
        value={notes}
        onChange={(e) => onNotesChange?.(e.currentTarget.value)}
        readOnly={readOnly}
        rows={4}
      />
    </Stack>
  )
}
