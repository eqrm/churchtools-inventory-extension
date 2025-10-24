import type { AssetStatus } from '../types/entities';

export const ASSET_STATUS_OPTIONS: ReadonlyArray<{ value: AssetStatus; label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'in-use', label: 'In Use' },
  { value: 'installed', label: 'Installed' },
  { value: 'in-repair', label: 'In Repair' },
  { value: 'broken', label: 'Broken' },
  { value: 'sold', label: 'Sold' },
  { value: 'destroyed', label: 'Destroyed' },
];

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = ASSET_STATUS_OPTIONS.reduce(
  (acc, option) => ({
    ...acc,
    [option.value]: option.label,
  }),
  {
    'available': 'Available',
    'in-use': 'In Use',
    installed: 'Installed',
    'in-repair': 'In Repair',
    broken: 'Broken',
    sold: 'Sold',
    destroyed: 'Destroyed',
    deleted: 'Deleted',
  } as Record<AssetStatus, string>,
);

export const ASSET_STATUS_KANBAN_ORDER: AssetStatus[] = [
  'available',
  'in-use',
  'installed',
  'in-repair',
  'broken',
  'sold',
  'destroyed',
];

export const ASSET_STATUS_KANBAN_COLORS: Partial<Record<AssetStatus, string>> = {
  available: 'green',
  'in-use': 'blue',
  installed: 'teal',
  'in-repair': 'yellow',
  broken: 'red',
  sold: 'gray',
  destroyed: 'dark',
};