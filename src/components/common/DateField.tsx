import React, { useState, useRef, useEffect } from 'react'
import { TextInput, Popover, ActionIcon } from '@mantine/core'
import { IconCalendar, IconX } from '@tabler/icons-react'
import DateSingleCalendar from './DateSingleCalendar'

interface Props {
  label?: string
  value?: string
  placeholder?: string
  onChange: (iso?: string) => void
}

export const DateField: React.FC<Props> = ({ label, value, placeholder, onChange }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handleDown(e: PointerEvent) {
      const el = e.target as Node | null
      if (!rootRef.current) return
      if (el && rootRef.current.contains(el)) return
      setOpen(false)
    }
    // use capture and pointerdown to catch clicks even if other handlers stop propagation
    document.addEventListener('pointerdown', handleDown, { capture: true })
    return () => document.removeEventListener('pointerdown', handleDown, { capture: true } as EventListenerOptions)
  }, [open])

  return (
    <div ref={rootRef}>
    <Popover
      opened={open}
      onClose={() => setOpen(false)}
      position="bottom-start"
      withArrow
      withinPortal={false}
      closeOnClickOutside={true}
      closeOnEscape={true}
      trapFocus={false}
    >
      <Popover.Target>
        <div>
          <TextInput
            label={label}
            value={value || ''}
            placeholder={placeholder || 'Select date'}
            readOnly
            onClick={() => setOpen(true)}
            rightSection={
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {value ? (
                  <ActionIcon size="sm" variant="subtle" onClick={(e) => { e.stopPropagation(); onChange(undefined); }} aria-label="Clear date">
                    <IconX size={14} />
                  </ActionIcon>
                ) : null}
                <ActionIcon size="sm" variant="subtle" onClick={(e) => { e.stopPropagation(); setOpen(true); }} aria-label="Open calendar">
                  <IconCalendar size={16} />
                </ActionIcon>
              </div>
            }
            style={{ minWidth: 220 }}
          />
        </div>
      </Popover.Target>
      <Popover.Dropdown>
        <DateSingleCalendar value={value} onChange={(iso) => { onChange(iso); setOpen(false) }} />
      </Popover.Dropdown>
    </Popover>
    </div>
  )
}

export default DateField
