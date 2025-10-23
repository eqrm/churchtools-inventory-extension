/**
 * Condition Assessment Component - Basic version without photo upload
 */

import { Stack, Select, Textarea, Title } from '@mantine/core'

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
      <Title order={4}>Zustandsbewertung</Title>
      <Select
        label="Zustand"
        data={[
          { value: 'excellent', label: 'Ausgezeichnet' },
          { value: 'good', label: 'Gut' },
          { value: 'fair', label: 'Akzeptabel' },
          { value: 'poor', label: 'Schlecht' },
          { value: 'damaged', label: 'Beschädigt' },
        ]}
        value={rating}
        onChange={(value) => onRatingChange?.(value || 'good')}
        disabled={readOnly}
      />
      <Textarea
        label="Notizen"
        placeholder="Beschädigungen, Probleme, oder Anmerkungen..."
        value={notes}
        onChange={(e) => onNotesChange?.(e.currentTarget.value)}
        readOnly={readOnly}
        rows={4}
      />
    </Stack>
  )
}
