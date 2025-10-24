import React from 'react'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface Props {
  value: { start?: string; end?: string } | undefined
  onChange: (range: { start?: string; end?: string } | undefined) => void
}

function toDate(y?: string) {
  if (!y) return undefined
  const d = new Date(y)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}

function toISO(d?: Date | null) {
  if (!d) return ''
  return d.toISOString().split('T')[0]
}

export const DateRangeCalendar: React.FC<Props> = ({ value, onChange }) => {
  const range: DateRange | undefined = value && value.start && value.end ? { from: toDate(value.start), to: toDate(value.end) } : undefined

  // Custom selection: when a full range exists, clicking any date restarts the selection with that date as 'from'
  const handleSelect = (selected: Date | Date[] | DateRange | undefined) => {
    if (!selected) {
      onChange(undefined)
      return
    }

    // react-day-picker returns DateRange when selecting range
    if ((selected as DateRange).from || (selected as DateRange).to) {
      const r = selected as DateRange
      if (r.from && r.to) {
        onChange({ start: toISO(r.from), end: toISO(r.to) })
        return
      }
      if (r.from && !r.to) {
        onChange({ start: toISO(r.from) })
        return
      }
      onChange(undefined)
      return
    }

    // If a single date is clicked and a full range already exists, restart with that date as 'start'
    if (selected instanceof Date) {
      if (value && value.start && value.end) {
        onChange({ start: toISO(selected) })
        return
      }
      // no existing range, treat as start
      onChange({ start: toISO(selected) })
      return
    }

    // Fallback
    onChange(undefined)
  }

  return (
    <div>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
      />
    </div>
  )
}

export default DateRangeCalendar
