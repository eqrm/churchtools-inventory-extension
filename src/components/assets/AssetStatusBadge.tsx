import { Badge } from '@mantine/core';
import type { AssetStatus } from '../../types/entities';

interface AssetStatusBadgeProps {
  status: AssetStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const STATUS_CONFIG: Record<AssetStatus, { color: string; label: string }> = {
  available: { color: 'green', label: 'Available' },
  'in-use': { color: 'blue', label: 'In Use' },
  broken: { color: 'red', label: 'Broken' },
  'in-repair': { color: 'orange', label: 'In Repair' },
  installed: { color: 'grape', label: 'Installed' },
  sold: { color: 'gray', label: 'Sold' },
  destroyed: { color: 'dark', label: 'Destroyed' },
};

export function AssetStatusBadge({ status, size = 'sm' }: AssetStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <Badge color={config.color} size={size} variant="filled">
      {config.label}
    </Badge>
  );
}
