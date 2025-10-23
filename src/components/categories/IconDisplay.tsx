import { Icon } from '@mdi/react';
import { mdiHelpCircleOutline } from '@mdi/js';
import { resolveCategoryIconPath } from '../../utils/iconMigrationMap';

interface IconDisplayProps {
  iconName?: string;
  size?: number | string;
}

export function IconDisplay({ iconName, size = 20 }: IconDisplayProps) {
  const mdiPath = resolveCategoryIconPath(iconName);
  const resolvedSize = typeof size === 'number' ? `${size}px` : size;
  return <Icon path={mdiPath ?? mdiHelpCircleOutline} size={resolvedSize} />;
}
