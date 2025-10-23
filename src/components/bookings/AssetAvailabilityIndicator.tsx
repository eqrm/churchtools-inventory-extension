/**
 * Asset Availability Indicator - Visual indicator for asset availability
 */

import { Badge } from '@mantine/core'

interface AssetAvailabilityIndicatorProps {
  isAvailable: boolean
  nextAvailableDate?: string
}

export function AssetAvailabilityIndicator({ isAvailable, nextAvailableDate }: AssetAvailabilityIndicatorProps) {
  if (isAvailable) {
    return <Badge color="green">Verfügbar</Badge>
  }

  return (
    <Badge color="red">
      Gebucht{nextAvailableDate ? ` bis ${new Date(nextAvailableDate).toLocaleDateString('de-DE')}` : ''}
    </Badge>
  )
}
