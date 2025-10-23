/**
 * KitAvailabilityIndicator Component - Stub Implementation
 * TODO: Full implementation needed for T138
 */

import { Badge } from '@mantine/core';

interface KitAvailabilityIndicatorProps {
  available: boolean;
  reason?: string;
}

export function KitAvailabilityIndicator({ available, reason }: KitAvailabilityIndicatorProps) {
  return (
    <Badge color={available ? 'green' : 'red'} title={reason}>
      {available ? 'Verfügbar' : 'Nicht verfügbar'}
    </Badge>
  );
}
