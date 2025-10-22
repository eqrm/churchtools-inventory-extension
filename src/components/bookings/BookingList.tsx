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
import { PersonDisplay } from '../common/PersonDisplay'
import type { Booking, BookingStatus, BookingFilters } from '../../types/entities'
import { bookingStrings } from '../../i18n/bookingStrings'

const PAGE_SIZE = 20

interface BookingListProps {
  onBookingClick?: (bookingId: string) => void
  onCreateClick?: () => void
  initialFilters?: BookingFilters
}

function useFilteredBookings(filters: BookingFilters, searchQuery: string) {
  const { data: bookings, isLoading, error } = useBookings(filters)

  const filteredBookings = bookings?.filter(booking => {
    // Apply person filters
    if (filters.bookingForId && booking.bookingForId !== filters.bookingForId) {
      return false
    }
    if (filters.bookedById && booking.bookedById !== filters.bookedById) {
      return false
    }
    
    // Apply search query
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      booking.asset?.name.toLowerCase().includes(query) ||
      booking.asset?.assetNumber.toLowerCase().includes(query) ||
      booking.purpose.toLowerCase().includes(query) ||
      booking.requestedByName.toLowerCase().includes(query) ||
      booking.bookingForName?.toLowerCase().includes(query) ||
      booking.bookedByName?.toLowerCase().includes(query)
    )
  })

  return { bookings: filteredBookings, isLoading, error }
}

function getTableColumns(): DataTableColumn<Booking>[] {
  return [
    { accessor: 'asset.assetNumber', title: 'Asset Number', sortable: true },
    { accessor: 'asset.name', title: 'Asset', sortable: true },
    {
      accessor: 'startDate',
      title: 'From',
      sortable: true,
      render: (b) => new Date(b.startDate).toLocaleDateString('en-US'),
    },
    {
      accessor: 'endDate',
      title: 'To',
      sortable: true,
      render: (b) => new Date(b.endDate).toLocaleDateString('en-US'),
    },
    { accessor: 'purpose', title: 'Purpose' },
    { 
      accessor: 'bookedByName', 
      title: 'Booked By', 
      sortable: true,
      render: (b) => <PersonDisplay 
        personId={b.bookedById} 
        personName={b.bookedByName || b.requestedByName} 
        size="xs" 
        textSize="sm" 
      />
    },
    { 
      accessor: 'bookingForName', 
      title: 'Booked For', 
      sortable: true,
      render: (b) => <PersonDisplay 
        personId={b.bookingForId} 
        personName={b.bookingForName || b.requestedByName} 
        size="xs" 
        textSize="sm" 
      />
    },
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
  allBookings?: Booking[]  // For building person filter options
}

function BookingFilters({ searchQuery, onSearchChange, filters, onFiltersChange, onCreateClick, allBookings }: FiltersProps) {
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

  // Build unique person lists from bookings
  const bookingForOptions = allBookings ? Array.from(
    new Map(
      allBookings
        .filter(b => b.bookingForId && b.bookingForName)
        .map(b => [b.bookingForId, { value: b.bookingForId, label: b.bookingForName || '' }])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label)) : []

  const bookedByOptions = allBookings ? Array.from(
    new Map(
      allBookings
        .filter(b => b.bookedById && b.bookedByName)
        .map(b => [b.bookedById, { value: b.bookedById, label: b.bookedByName || '' }])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label)) : []

  return (
    <Group>
      <TextInput 
        placeholder="Search..." 
        leftSection={<IconSearch size={16} />} 
        value={searchQuery} 
        onChange={(e) => onSearchChange(e.currentTarget.value)} 
        style={{ flex: 1 }} 
      />
      <Select 
        placeholder="Status" 
        leftSection={<IconFilter size={16} />} 
        data={[
          { value: '', label: 'All' }, 
          { value: 'pending', label: bookingStrings.status.pending }, 
          { value: 'approved', label: bookingStrings.status.approved }, 
          { value: 'active', label: bookingStrings.status.active }, 
          { value: 'completed', label: bookingStrings.status.completed }
        ]} 
        value={(filters.status as string) || ''} 
        onChange={(value) => onFiltersChange({ ...filters, status: value as BookingStatus || undefined })} 
        clearable 
      />
      <Select 
        placeholder="Booked By" 
        leftSection={<IconFilter size={16} />} 
        data={bookedByOptions} 
        value={filters.bookedById || ''} 
        onChange={(value) => onFiltersChange({ ...filters, bookedById: value || undefined })} 
        clearable 
        searchable
      />
      <Select 
        placeholder="Booked For" 
        leftSection={<IconFilter size={16} />} 
        data={bookingForOptions} 
        value={filters.bookingForId || ''} 
        onChange={(value) => onFiltersChange({ ...filters, bookingForId: value || undefined })} 
        clearable 
        searchable
      />
      <DatePickerInput 
        type="range" 
        placeholder="Date" 
        value={filters.dateRange ? [new Date(filters.dateRange.start), new Date(filters.dateRange.end)] : [null, null]} 
        onChange={handleDateChange} 
        clearable 
      />
      {onCreateClick && <Button leftSection={<IconPlus size={16} />} onClick={onCreateClick}>New</Button>}
    </Group>
  )
}

export function BookingList({ onBookingClick, onCreateClick, initialFilters = {} }: BookingListProps) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<BookingFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const { bookings, isLoading, error } = useFilteredBookings(filters, searchQuery)
  
  // Get all bookings without search filter for building person options
  const { data: allBookings } = useBookings(filters)

  if (isLoading) {
    return (
      <Stack gap="md">
        <BookingFilters 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          filters={filters} 
          onFiltersChange={setFilters} 
          onCreateClick={onCreateClick}
          allBookings={allBookings}
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
          allBookings={allBookings}
        />
        <EmptyState
          title={bookingStrings.messages.noBookingsFound}
          message={searchQuery || filters.status || filters.dateRange 
            ? bookingStrings.messages.noBookingsMatchFilters 
            : bookingStrings.messages.createFirstBooking}
          icon={<IconCalendarEvent size={48} stroke={1.5} />}
          action={onCreateClick && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateClick}>
              {bookingStrings.messages.createFirstBookingButton}
            </Button>
          )}
        />
      </Stack>
    )
  }

  const paginatedBookings = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Stack gap="md">
      <BookingFilters 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        filters={filters} 
        onFiltersChange={setFilters} 
        onCreateClick={onCreateClick}
        allBookings={allBookings}
      />
      <DataTable 
        records={paginatedBookings} 
        columns={getTableColumns()} 
        totalRecords={bookings.length} 
        recordsPerPage={PAGE_SIZE} 
        page={page} 
        onPageChange={setPage} 
        onRowClick={onBookingClick ? ({ record }) => onBookingClick(record.id) : undefined} 
        highlightOnHover={!!onBookingClick}
        rowStyle={() => onBookingClick ? { cursor: 'pointer' } : undefined}
      />
    </Stack>
  )
}
