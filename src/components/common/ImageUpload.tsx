// Image upload UI has been disabled due to ChurchTools customdata size limits.
// Keeping a small stub component avoids missing-module errors while the feature is deferred.
import { Text, Paper } from '@mantine/core'

export interface ImageUploadProps {
  onFileSelect?: (file: File) => void
  onError?: (error: string) => void
  disabled?: boolean
  maxFiles?: number
  currentFileCount?: number
}

export function ImageUpload(_: ImageUploadProps) {
  return (
    <Paper withBorder p="md">
      <Text c="dimmed">Image upload is temporarily disabled due to storage constraints.</Text>
    </Paper>
  )
}