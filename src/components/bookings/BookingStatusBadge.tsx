/**
 * BookingStatusBadge Component
 * 
 * Displays a color-coded badge for booking status.
 */

import { Badge } from '@mantine/core'
import type { BookingStatus } from '../../types/entities'

interface BookingStatusBadgeProps {
  status: BookingStatus
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'Ausstehend', color: 'gray' },
  approved: { label: 'Genehmigt', color: 'blue' },
  active: { label: 'Aktiv', color: 'green' },
  completed: { label: 'Abgeschlossen', color: 'teal' },
  overdue: { label: 'Überfällig', color: 'red' },
  cancelled: { label: 'Storniert', color: 'dark' },
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  
  return (
    <Badge color={config.color} variant="light">
      {config.label}
    </Badge>
  )
}
