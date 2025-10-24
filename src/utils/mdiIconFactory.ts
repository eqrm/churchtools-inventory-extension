import { createElement, type ComponentType } from 'react'
import { Icon } from '@mdi/react'

/**
 * Helper to create Mantine-compatible icon components using MDI paths.
 * Converts pixel-based size props (e.g. 16) into the em-based size expected by @mdi/react.
 */
export function createMdiIconComponent(path: string): ComponentType<{ size?: number | string }> {
  const MdiIcon: ComponentType<{ size?: number | string }> = ({ size = 16 }) => {
    const normalizedSize = typeof size === 'number' ? size / 24 : size
    return createElement(Icon, { path, size: normalizedSize })
  }

  MdiIcon.displayName = `MdiIcon(${path.slice(0, 12)}${path.length > 12 ? '…' : ''})`

  return MdiIcon
}
