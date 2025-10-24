// Asset photo gallery has been disabled due to ChurchTools customdata size constraints.
// Keep a small presentational stub to avoid breaking imports where the feature is not yet removed.
import { Text, Paper } from '@mantine/core'

export interface AssetPhotoGalleryProps {
  readonly?: boolean
}

export function AssetPhotoGallery(_: AssetPhotoGalleryProps) {
  return (
    <Paper withBorder p="md">
      <Text c="dimmed">Asset photo gallery is temporarily disabled due to storage constraints.</Text>
    </Paper>
  )
}