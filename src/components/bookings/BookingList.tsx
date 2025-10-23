/**
 * BookingList Component
 * 
 * Displays a paginated, filterable list of equipment bookings using DataTable.
 * Supports filtering by status, date range, and requester.
 */

import { useState } from 'react'
import { Stack, Group, Select, TextInput, Button } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconSearch, IconFilter, IconPlus, IconCalendarEvent } from '@tabler/icons-react'
import { DataTable, type DataTableColumn } from 'mantine-datatable'
import { useBookings } from '../../hooks/useBookings'
import { BookingStatusBadge } from './BookingStatusBadge'
import { ListLoadingSkeleton } from '../common/ListLoadingSkeleton'
import { EmptyState } from '../common/EmptyState'
import type { Booking, BookingStatus, BookingFilters } from '../../types/entities'

const PAGE_SIZE = 20

interface BookingListProps {
  onBookingClick?: (bookingId: string) => void
  onCreateClick?: () => void
  initialFilters?: BookingFilters
}

function useFilteredBookings(filters: BookingFilters, searchQuery: string) {
  const { data: bookings, isLoading, error } = useBookings(filters)

  const filteredBookings = bookings?.filter(booking => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      booking.asset?.name.toLowerCase().includes(query) ||
      booking.asset?.assetNumber.toLowerCase().includes(query) ||
      booking.purpose.toLowerCase().includes(query) ||
      booking.requestedByName.toLowerCase().includes(query)
    )
  })

  return { bookings: filteredBookings, isLoading, error }
}

function getTableColumns(): DataTableColumn<Booking>[] {
  return [
    { accessor: 'asset.assetNumber', title: 'Asset-Nummer', sortable: true },
    { accessor: 'asset.name', title: 'Asset', sortable: true },
    {
      accessor: 'startDate',
      title: 'Von',
      sortable: true,
      render: (b) => new Date(b.startDate).toLocaleDateString('de-DE'),
    },
    {
      accessor: 'endDate',
      title: 'Bis',
      sortable: true,
      render: (b) => new Date(b.endDate).toLocaleDateString('de-DE'),
    },
    { accessor: 'purpose', title: 'Zweck' },
    { accessor: 'requestedByName', title: 'Von', sortable: true },
    {
      accessor: 'status',
      title: 'Status',
      sortable: true,
      render: (b) => <BookingStatusBadge status={b.status} />,
    },
  ]
}

interface FiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filters: BookingFilters
  onFiltersChange: (filters: BookingFilters) => void
  onCreateClick?: () => void
}

function BookingFilters({ searchQuery, onSearchChange, filters, onFiltersChange, onCreateClick }: FiltersProps) {
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    if (dates[0] && dates[1]) {
      const start = dates[0].toISOString().split('T')[0]
      const end = dates[1].toISOString().split('T')[0]
      if (start && end) onFiltersChange({ ...filters, dateRange: { start, end } })
    } else {
      const { dateRange: _removed, ...rest } = filters
      onFiltersChange(rest)
    }
  }

  return (
    <Group>
      <TextInput placeholder="Suche..." leftSection={<IconSearch size={16} />} value={searchQuery} onChange={(e) => onSearchChange(e.currentTarget.value)} style={{ flex: 1 }} />
      <Select placeholder="Status" leftSection={<IconFilter size={16} />} data={[{ value: '', label: 'Alle' }, { value: 'pending', label: 'Ausstehend' }, { value: 'approved', label: 'Genehmigt' }, { value: 'active', label: 'Aktiv' }, { value: 'completed', label: 'Abgeschlossen' }]} value={(filters.status as string) || ''} onChange={(value) => onFiltersChange({ ...filters, status: value as BookingStatus || undefined })} clearable />
      <DatePickerInput type="range" placeholder="Datum" value={filters.dateRange ? [new Date(filters.dateRange.start), new Date(filters.dateRange.end)] : [null, null]} onChange={handleDateChange} clearable />
      {onCreateClick && <Button leftSection={<IconPlus size={16} />} onClick={onCreateClick}>Neu</Button>}
    </Group>
  )
}

export function BookingList({ onBookingClick, onCreateClick, initialFilters = {} }: BookingListProps) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<BookingFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const { bookings, isLoading, error } = useFilteredBookings(filters, searchQuery)

  if (isLoading) {
    return (
      <Stack gap="md">
        <BookingFilters 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          filters={filters} 
          onFiltersChange={setFilters} 
          onCreateClick={onCreateClick} 
        />
        <ListLoadingSkeleton rows={PAGE_SIZE} height={60} />
      </Stack>
    )
  }

  if (error) return <div>Fehler: {(error as Error).message}</div>

  if (!bookings || bookings.length === 0) {
    return (
      <Stack gap="md">
        <BookingFilters 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          filters={filters} 
          onFiltersChange={setFilters} 
          onCreateClick={onCreateClick} 
        />
        <EmptyState
          title="Keine Buchungen vorhanden"
          message={searchQuery || filters.status || filters.dateRange 
            ? "Keine Buchungen entsprechen den Filterkriterien." 
            : "Erstellen Sie Ihre erste Buchung, um Equipment zu reservieren."}
          icon={<IconCalendarEvent size={48} stroke={1.5} />}
          action={onCreateClick && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateClick}>
              Erste Buchung erstellen
            </Button>
          )}
        />
      </Stack>
    )
  }

  const paginatedBookings = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Stack gap="md">
      <BookingFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} filters={filters} onFiltersChange={setFilters} onCreateClick={onCreateClick} />
      <DataTable records={paginatedBookings} columns={getTableColumns()} totalRecords={bookings.length} recordsPerPage={PAGE_SIZE} page={page} onPageChange={setPage} onRowClick={onBookingClick ? ({ record }) => onBookingClick(record.id) : undefined} highlightOnHover={!!onBookingClick} />
    </Stack>
  )
}
