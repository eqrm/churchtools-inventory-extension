/**
 * Condition Assessment Component with Photo Upload Support
 */

import { Stack, Select, Textarea, Title, Text, Group } from '@mantine/core'
import { Dropzone, IMAGE_MIME_TYPE, type FileWithPath } from '@mantine/dropzone'
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react'
import { useState } from 'react'

interface ConditionAssessmentProps {
  rating?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  notes?: string
  photos?: string[]
  onRatingChange?: (rating: string) => void
  onNotesChange?: (notes: string) => void
  onPhotosChange?: (photos: string[]) => void
  readOnly?: boolean
}

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

function PhotoDropzone({ onPhotosAdded }: { onPhotosAdded: (photos: string[]) => void }) {
  const handleDrop = async (files: FileWithPath[]) => {
    const base64Photos = await Promise.all(files.map(convertToBase64))
    onPhotosAdded(base64Photos)
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>Fotos</Text>
      <Dropzone onDrop={handleDrop} accept={IMAGE_MIME_TYPE} maxSize={5 * 1024 ** 2}>
        <Group justify="center" gap="xs" style={{ minHeight: 80, pointerEvents: 'none' }}>
          <Dropzone.Accept><IconUpload size={32} /></Dropzone.Accept>
          <Dropzone.Reject><IconX size={32} /></Dropzone.Reject>
          <Dropzone.Idle><IconPhoto size={32} /></Dropzone.Idle>
          <div>
            <Text size="sm">Bilder hierher ziehen</Text>
            <Text size="xs" c="dimmed">Max. 5MB</Text>
          </div>
        </Group>
      </Dropzone>
    </Stack>
  )
}

function RatingSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <Select
      label="Zustand"
      data={[
        { value: 'excellent', label: 'Ausgezeichnet' },
        { value: 'good', label: 'Gut' },
        { value: 'fair', label: 'Akzeptabel' },
        { value: 'poor', label: 'Schlecht' },
        { value: 'damaged', label: 'Beschädigt' },
      ]}
      value={value}
      onChange={(v) => onChange(v || 'good')}
      disabled={disabled}
    />
  )
}

export function ConditionAssessmentWithPhotos({
  rating = 'good',
  notes = '',
  photos = [],
  onRatingChange,
  onNotesChange,
  onPhotosChange,
  readOnly = false,
}: ConditionAssessmentProps) {
  const [previews, setPreviews] = useState<string[]>(photos)

  const handlePhotosAdded = (newPhotos: string[]) => {
    const updated = [...previews, ...newPhotos]
    setPreviews(updated)
    onPhotosChange?.(updated)
  }

  return (
    <Stack gap="md">
      <Title order={4}>Zustandsbewertung</Title>
      <RatingSelect
        value={rating}
        onChange={(v) => onRatingChange?.(v)}
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
      {!readOnly && <PhotoDropzone onPhotosAdded={handlePhotosAdded} />}
      {previews.length > 0 && (
        <Group gap="xs">
          {previews.map((preview, idx) => (
            <img key={idx} src={preview} alt={`Foto ${idx + 1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} />
          ))}
        </Group>
      )}
    </Stack>
  )
}
