import React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface Props {
  value?: string
  onChange: (isoDate?: string) => void
}

function toDate(iso?: string) {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}

export const DateSingleCalendar: React.FC<Props> = ({ value, onChange }) => {
  const selected = value ? toDate(value) : undefined

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={(d) => {
        if (!d) { onChange(undefined); return }
        onChange(d.toISOString().split('T')[0])
      }}
    />
  )
}

export default DateSingleCalendar
