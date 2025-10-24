import { useEffect, useState } from 'react';
import { Icon } from '@mdi/react';
import { mdiHelpCircleOutline } from '@mdi/js';
import { resolveCategoryIconPath, registerDynamicIcon } from '../../utils/iconMigrationMap';
import { ensureIconOption } from '../../utils/mdiDynamicRegistry';

interface IconDisplayProps {
  iconName?: string;
  size?: number | string;
}

export function IconDisplay({ iconName, size = 20 }: IconDisplayProps) {
  const [dynamicPath, setDynamicPath] = useState<string | undefined>(undefined);
  const mdiPath = resolveCategoryIconPath(iconName) ?? dynamicPath;

  useEffect(() => {
    if (!iconName) {
      setDynamicPath(undefined);
      return;
    }

    if (!iconName.startsWith('mdi:')) {
      setDynamicPath(undefined);
      return;
    }

    if (mdiPath) {
      return;
    }

    let active = true;
    setDynamicPath(undefined);

    void ensureIconOption(iconName).then((option) => {
      if (!active) {
        return;
      }
      if (option) {
        registerDynamicIcon(option);
        setDynamicPath(option.path);
      }
    });

    return () => {
      active = false;
    };
  }, [iconName, mdiPath]);

  const resolvedSize = typeof size === 'number' ? `${size}px` : size;
  return <Icon path={mdiPath ?? mdiHelpCircleOutline} size={resolvedSize} />;
}
