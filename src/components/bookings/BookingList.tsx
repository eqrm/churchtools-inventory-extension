/**
 * BookingList Component
 * 
 * Displays a paginated, filterable list of equipment bookings using DataTable.
 * Supports filtering by status, date range, and requester.
 */

import { useState, useEffect } from 'react'
import { Stack, Group, Select, TextInput, Button } from '@mantine/core'
// Date range calendar uses react-day-picker via DateRangeCalendar
import DateField from '../common/DateField'
import { IconSearch, IconFilter, IconPlus, IconCalendarEvent } from '@tabler/icons-react'
import { DataTable, type DataTableColumn } from 'mantine-datatable'
import { useBookings } from '../../hooks/useBookings'
import { BookingStatusBadge } from './BookingStatusBadge'
import { ListLoadingSkeleton } from '../common/ListLoadingSkeleton'
import { EmptyState } from '../common/EmptyState'
import { PersonDisplay } from '../common/PersonDisplay'
import type { Booking, BookingStatus, BookingFilters } from '../../types/entities'
import { bookingStrings } from '../../i18n/bookingStrings'

const BOOKING_PAGE_SIZE_OPTIONS: number[] = [10, 20, 50, 100]
const BOOKING_PAGE_SIZE_STORAGE_KEY = 'booking-list-page-size'
const DEFAULT_BOOKING_PAGE_SIZE = 20

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
  // Date range selection: keep a local start/end so fields show chosen values immediately
  const [localStart, setLocalStart] = useState<string>(filters.dateRange?.start || '')
  const [localEnd, setLocalEnd] = useState<string>(filters.dateRange?.end || '')

  useEffect(() => {
    setLocalStart(filters.dateRange?.start || '')
    setLocalEnd(filters.dateRange?.end || '')
  }, [filters.dateRange])

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
    <Group align="center">
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
      <Group align="center">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ minWidth: 180 }}>
            <DateField
              placeholder="Start date"
              value={localStart}
              onChange={(iso) => {
                const newStart = iso || ''
                setLocalStart(newStart)
                const effectiveEnd = localEnd
                if (newStart && effectiveEnd) {
                  onFiltersChange({ ...filters, dateRange: { start: newStart, end: effectiveEnd } })
                } else {
                  // Keep other filters unchanged until both dates selected
                  const { dateRange: _removed, ...rest } = filters
                  onFiltersChange(rest)
                }
              }}
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <DateField
              placeholder="End date"
              value={localEnd}
              onChange={(iso) => {
                const newEnd = iso || ''
                setLocalEnd(newEnd)
                const effectiveStart = localStart
                if (effectiveStart && newEnd) {
                  onFiltersChange({ ...filters, dateRange: { start: effectiveStart, end: newEnd } })
                } else {
                  const { dateRange: _removed, ...rest } = filters
                  onFiltersChange(rest)
                }
              }}
            />
          </div>
        </div>
      </Group>
      {onCreateClick && <Button leftSection={<IconPlus size={16} />} onClick={onCreateClick}>New</Button>}
    </Group>
  )
}

export function BookingList({ onBookingClick, onCreateClick, initialFilters = {} }: BookingListProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_BOOKING_PAGE_SIZE
    }
    const stored = window.localStorage.getItem(BOOKING_PAGE_SIZE_STORAGE_KEY)
    const parsed = stored ? Number.parseInt(stored, 10) : NaN
    return BOOKING_PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_BOOKING_PAGE_SIZE
  })
  const [filters, setFilters] = useState<BookingFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const { bookings, isLoading, error } = useFilteredBookings(filters, searchQuery)
  
  // Get all bookings without search filter for building person options
  const { data: allBookings } = useBookings(filters)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(BOOKING_PAGE_SIZE_STORAGE_KEY, String(pageSize))
  }, [pageSize])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((bookings?.length ?? 0) / pageSize))
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, bookings?.length, pageSize])

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
  <ListLoadingSkeleton rows={pageSize} height={60} />
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

  const paginatedBookings = bookings.slice((page - 1) * pageSize, page * pageSize)

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
        recordsPerPage={pageSize} 
        recordsPerPageOptions={BOOKING_PAGE_SIZE_OPTIONS}
        page={page} 
        onPageChange={setPage} 
        onRecordsPerPageChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onRowClick={onBookingClick ? ({ record }) => onBookingClick(record.id) : undefined} 
        highlightOnHover={!!onBookingClick}
        rowStyle={() => onBookingClick ? { cursor: 'pointer' } : undefined}
      />
    </Stack>
  )
}
