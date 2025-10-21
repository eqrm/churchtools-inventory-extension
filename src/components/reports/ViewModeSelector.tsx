import { SegmentedControl } from '@mantine/core';
import { IconTable, IconLayoutGrid, IconLayoutKanban, IconCalendar, IconList } from '@tabler/icons-react';
import type { ViewMode } from '../../types/entities';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

/**
 * Selector for switching between different view modes
 */
export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(val) => onChange(val as ViewMode)}
      data={[
        {
          value: 'table',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTable size={16} />
              <span>Tabelle</span>
            </div>
          ),
        },
        {
          value: 'gallery',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconLayoutGrid size={16} />
              <span>Galerie</span>
            </div>
          ),
        },
        {
          value: 'kanban',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconLayoutKanban size={16} />
              <span>Kanban</span>
            </div>
          ),
        },
        {
          value: 'calendar',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconCalendar size={16} />
              <span>Kalender</span>
            </div>
          ),
        },
        {
          value: 'list',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconList size={16} />
              <span>Liste</span>
            </div>
          ),
        },
      ]}
    />
  );
}
