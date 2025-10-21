/**
 * MaintenanceReminderBadge component (T175)
 * Shows maintenance status as a colored badge
 */

import { Badge, Tooltip } from '@mantine/core';
import { IconAlertTriangle, IconClock } from '@tabler/icons-react';
import { daysUntilDue } from '../../utils/maintenanceCalculations';
import type { MaintenanceSchedule } from '../../types/entities';

interface MaintenanceReminderBadgeProps {
  schedule: MaintenanceSchedule;
}

/**
 * Badge showing maintenance status
 * Red = overdue, Yellow = due soon, Green = ok
 */
export function MaintenanceReminderBadge({ schedule }: MaintenanceReminderBadgeProps) {
  const days = daysUntilDue(schedule);

  if (days === null || !schedule.nextDue) {
    return null;
  }

  let color: string;
  let icon: React.ReactNode;
  let label: string;
  let tooltip: string;

  if (days < 0) {
    // Overdue
    color = 'red';
    icon = <IconAlertTriangle size={12} />;
    label = `${Math.abs(days)}d überfällig`;
    tooltip = `Wartung ist ${Math.abs(days)} Tag(e) überfällig`;
  } else if (days <= schedule.reminderDaysBefore) {
    // Due soon
    color = 'yellow';
    icon = <IconClock size={12} />;
    label = `${days}d`;
    tooltip = `Wartung fällig in ${days} Tag(en)`;
  } else {
    // OK
    color = 'green';
    icon = null;
    label = `${days}d`;
    tooltip = `Nächste Wartung in ${days} Tag(en)`;
  }

  return (
    <Tooltip label={tooltip}>
      <Badge color={color} size="sm" leftSection={icon}>
        {label}
      </Badge>
    </Tooltip>
  );
}
