/**
 * Icon Migration Map: Tabler Icons → MDI Icons
 *
 * This file provides a mapping from Tabler icon names to their MDI equivalents.
 * Used during the gradual migration from Tabler to MDI icons.
 *
 * MDI icons are imported from @mdi/js and rendered using @mdi/react.
 */

import {
  mdiMicrophone,
  mdiTelevision,
  mdiLightbulb,
  mdiCamera,
  mdiMusic,
  mdiHeadphones,
  mdiSpeaker,
  mdiPowerPlug,
  mdiWifi,
  mdiRouterNetwork,
  mdiLaptop,
  mdiDesktopClassic,
  mdiKeyboard,
  mdiMouse,
  mdiPrinter,
  mdiPresentation,
  mdiChevronDown,
  mdiClose,
  mdiPlus,
  mdiTrashCan,
  mdiCheck,
  mdiAlertCircle,
  mdiRefresh,
  mdiEmoticonSadOutline,
  mdiDotsHorizontal,
  mdiLink,
  mdiTransfer,
  mdiAccountGroup,
  mdiArrowUp,
  mdiClock,
  mdiTools,
  mdiCalendar,
  mdiMagnify,
  mdiFilter,
  mdiCalendarEnd,
  mdiUpload,
  mdiImage,
  mdiStar,
  mdiStarOutline,
  mdiInformation,
  mdiBarcode,
  mdiCog,
  mdiQrcode,
  mdiAlert,
  mdiTune,
  mdiPound,
  mdiMapMarker,
  mdiPencil,
  mdiEye,
  mdiEarth,
  mdiLock,
  mdiTable,
  mdiViewGrid,
  mdiViewDashboard,
  mdiFormatListBulleted,
  mdiDownload,
  mdiPackage,
  mdiShape,
  mdiHistory,
  mdiTrendingUp,
  mdiContentSave,
  mdiArrowLeft,
  mdiAccount,
  mdiWifiOff,
  mdiCloudUpload,
  mdiKeyboard as mdiKeyboardShortcut,
  mdiPackageVariant,
  mdiClose as mdiX,
} from '@mdi/js';
import {
  cacheIconOption,
  deriveLabelFromValue,
  getCachedIconOption,
  isLikelyMdiValue,
} from './mdiDynamicRegistry';

export interface CategoryIconOption {
  value: string;
  label: string;
  path: string;
  keywords: string[];
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { value: 'mdi:microphone', label: 'Microphone', path: mdiMicrophone, keywords: ['audio', 'sound', 'mic'] },
  { value: 'mdi:television', label: 'Display', path: mdiTelevision, keywords: ['tv', 'screen', 'video'] },
  { value: 'mdi:lightbulb', label: 'Lighting', path: mdiLightbulb, keywords: ['light', 'stage', 'illumination'] },
  { value: 'mdi:camera', label: 'Camera', path: mdiCamera, keywords: ['photo', 'video', 'dslr'] },
  { value: 'mdi:music', label: 'Music', path: mdiMusic, keywords: ['instrument', 'audio'] },
  { value: 'mdi:headphones', label: 'Headphones', path: mdiHeadphones, keywords: ['audio', 'monitoring'] },
  { value: 'mdi:speaker', label: 'Speaker', path: mdiSpeaker, keywords: ['audio', 'pa'] },
  { value: 'mdi:power-plug', label: 'Power Connector', path: mdiPowerPlug, keywords: ['connector', 'power'] },
  { value: 'mdi:wifi', label: 'Network', path: mdiWifi, keywords: ['network', 'wireless'] },
  { value: 'mdi:router-network', label: 'Router', path: mdiRouterNetwork, keywords: ['network', 'router'] },
  { value: 'mdi:laptop', label: 'Laptop', path: mdiLaptop, keywords: ['computer', 'mobile'] },
  { value: 'mdi:desktop-classic', label: 'Desktop', path: mdiDesktopClassic, keywords: ['computer', 'workstation'] },
  { value: 'mdi:keyboard', label: 'Keyboard', path: mdiKeyboard, keywords: ['input', 'computer'] },
  { value: 'mdi:mouse', label: 'Mouse', path: mdiMouse, keywords: ['input', 'computer'] },
  { value: 'mdi:printer', label: 'Printer', path: mdiPrinter, keywords: ['print', 'office'] },
  { value: 'mdi:presentation', label: 'Projector', path: mdiPresentation, keywords: ['projection', 'display'] },
];

/**
 * Mapping from Tabler icon names to MDI icon paths
 * Used by IconDisplay component for backward compatibility
 */
export const TABLER_TO_MDI_MAP: Record<string, string> = {
  // Category icons (from IconPicker)
  'Microphone': mdiMicrophone,
  'TV/Display': mdiTelevision,
  'Lighting': mdiLightbulb,
  'Camera': mdiCamera,
  'Music': mdiMusic,
  'Headphones': mdiHeadphones,
  'Speaker': mdiSpeaker,
  'Connector': mdiPowerPlug,
  'Cable': mdiWifi,
  'Network': mdiRouterNetwork,
  'Laptop': mdiLaptop,
  'Desktop': mdiDesktopClassic,
  'Keyboard': mdiKeyboard,
  'Mouse': mdiMouse,
  'Printer': mdiPrinter,
  'Projector': mdiPresentation,

  // Common UI icons
  'ChevronDown': mdiChevronDown,
  'X': mdiClose,
  'Plus': mdiPlus,
  'Trash': mdiTrashCan,
  'Check': mdiCheck,
  'AlertCircle': mdiAlertCircle,
  'Refresh': mdiRefresh,
  'MoodEmpty': mdiEmoticonSadOutline,
  'Dots': mdiDotsHorizontal,
  'Link': mdiLink,
  'Transfer': mdiTransfer,
  'Users': mdiAccountGroup,
  'ArrowUp': mdiArrowUp,
  'Clock': mdiClock,
  'Tool': mdiTools,
  'Calendar': mdiCalendar,
  'Search': mdiMagnify,
  'Filter': mdiFilter,
  'CalendarEvent': mdiCalendarEnd,
  'Upload': mdiUpload,
  'Photo': mdiImage,
  'Star': mdiStarOutline,
  'StarFilled': mdiStar,
  'InfoCircle': mdiInformation,
  'Barcode': mdiBarcode,
  'Settings': mdiCog,
  'Qrcode': mdiQrcode,
  'AlertTriangle': mdiAlert,
  'Adjustments': mdiTune,
  'Hash': mdiPound,
  'MapPin': mdiMapMarker,
  'Edit': mdiPencil,
  'Eye': mdiEye,
  'World': mdiEarth,
  'Lock': mdiLock,
  'Table': mdiTable,
  'LayoutGrid': mdiViewGrid,
  'LayoutKanban': mdiViewDashboard,
  'List': mdiFormatListBulleted,
  'Download': mdiDownload,
  'Box': mdiPackage,
  'Category': mdiShape,
  'History': mdiHistory,
  'TrendingUp': mdiTrendingUp,
  'DeviceFloppy': mdiContentSave,
  'ArrowLeft': mdiArrowLeft,
  'User': mdiAccount,
  'WifiOff': mdiWifiOff,
  'CloudUpload': mdiCloudUpload,
  'KeyboardShortcut': mdiKeyboardShortcut,
  'BoxMultiple': mdiPackageVariant,
  'Close': mdiX,
};

/**
 * Register a dynamic icon option at runtime.
 * This is used by the IconPicker to add user-resolved MDI icons
 * so they are recognized by normalize/resolve helpers.
 */
export function registerDynamicIcon(option: CategoryIconOption): boolean {
  cacheIconOption(option);
  // avoid duplicates by value
  if (!CATEGORY_ICON_OPTIONS.some((o) => o.value === option.value)) {
    // mutate the existing array so constant binding stays valid
    (CATEGORY_ICON_OPTIONS as CategoryIconOption[]).push(option);
    return true;
  }
  return false;
}

export function normalizeCategoryIconValue(iconValue?: string): string | undefined {
  if (!iconValue) {
    return undefined;
  }

  if (isLikelyMdiValue(iconValue)) {
    return iconValue;
  }

  const pathMatch = CATEGORY_ICON_OPTIONS.find((option) => option.path === iconValue);
  if (pathMatch) {
    return pathMatch.value;
  }

  const mappedPath = getMdiIconForTabler(iconValue);
  if (!mappedPath) {
    return undefined;
  }

  const matchingOption = CATEGORY_ICON_OPTIONS.find((option) => option.path === mappedPath);
  return matchingOption?.value;
}

export function resolveCategoryIconPath(iconValue?: string): string | undefined {
  const normalizedValue = normalizeCategoryIconValue(iconValue);
  if (!normalizedValue) {
    return undefined;
  }
  const option =
    CATEGORY_ICON_OPTIONS.find((candidate) => candidate.value === normalizedValue) ??
    getCachedIconOption(normalizedValue);
  return option?.path;
}

export function resolveCategoryIconLabel(iconValue?: string): string | undefined {
  const normalizedValue = normalizeCategoryIconValue(iconValue);
  if (!normalizedValue) {
    return undefined;
  }
  const option =
    CATEGORY_ICON_OPTIONS.find((candidate) => candidate.value === normalizedValue) ??
    getCachedIconOption(normalizedValue);
  if (option) {
    return option.label;
  }
  if (normalizedValue.startsWith('mdi:')) {
    return deriveLabelFromValue(normalizedValue);
  }
  return undefined;
}

/**
 * Get MDI icon path for a Tabler icon name
 * @param tablerIconName - The Tabler icon name (e.g., 'Microphone', 'Plus')
 * @returns MDI icon path string or undefined if not found
 */
export function getMdiIconForTabler(tablerIconName: string): string | undefined {
  return TABLER_TO_MDI_MAP[tablerIconName];
}

/**
 * Check if a Tabler icon has an MDI equivalent
 * @param tablerIconName - The Tabler icon name
 * @returns true if mapping exists
 */
export function hasMdiEquivalent(tablerIconName: string): boolean {
  return tablerIconName in TABLER_TO_MDI_MAP;
}