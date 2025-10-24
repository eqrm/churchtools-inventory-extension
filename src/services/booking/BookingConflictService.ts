/**
 * Booking Conflict Service
 * 
 * Phase 7 (T071-T074): Asset availability filtering and conflict detection
 * Implements last-write-wins strategy per clarification Q1
 */

import type { Booking, BookingCreate } from '../../types/entities'

export interface CheckConflictRequest {
  assetId: string
  bookingMode: 'single-day' | 'date-range'
  date?: string  // ISO date for single-day
  startTime?: string  // HH:mm
  endTime?: string    // HH:mm
  startDate?: string  // ISO date for range start
  endDate?: string    // ISO date for range end
  excludeBookingId?: string  // Exclude when editing
}

export interface BookingConflict {
  conflictingBookingId: string
  assetId: string
  conflictStart: Date
  conflictEnd: Date
  bookedBy: string
  bookedByName?: string
  bookingFor: string
  bookingForName?: string
  status: string
}

export interface CheckConflictResponse {
  hasConflicts: boolean
  conflicts: BookingConflict[]
  isBookable: boolean
  unbookableReason?: string
}

export class BookingConflictService {
  /**
   * T072: Check for booking conflicts
   */
  async checkConflicts(
    request: CheckConflictRequest,
    allBookings: Booking[]
  ): Promise<CheckConflictResponse> {
    // Get bookings for this asset
    const assetBookings = allBookings.filter(b =>
      b.asset?.id === request.assetId &&
      // Only check active booking statuses
      ['pending', 'approved', 'active'].includes(b.status) &&
      // Exclude the booking being edited
      b.id !== request.excludeBookingId
    )

    // T073: Detect conflicts using overlap algorithm
    const conflicts: BookingConflict[] = []
    const requestRange = this.normalizeBookingRange(request)

    for (const booking of assetBookings) {
      const bookingRange = this.normalizeBookingRangeFromBooking(booking)
      
      if (this.rangesOverlap(requestRange, bookingRange)) {
        conflicts.push({
          conflictingBookingId: booking.id,
          assetId: booking.asset?.id || '',
          conflictStart: bookingRange.start,
          conflictEnd: bookingRange.end,
          bookedBy: booking.bookedById,
          bookedByName: booking.bookedByName,
          bookingFor: booking.bookingForId,
          bookingForName: booking.bookingForName,
          status: booking.status,
        })
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      isBookable: true,  // Assume bookable unless asset check shows otherwise
    }
  }

  /**
   * T073: Normalize booking request to start/end DateTime
   */
  private normalizeBookingRange(request: CheckConflictRequest): { start: Date; end: Date } {
    if (request.bookingMode === 'single-day' && request.date) {
      // Single day: combine date with times
      const dateStr = request.date
      const startTime = request.startTime || '00:00'
      const endTime = request.endTime || '23:59'
      
      return {
        start: new Date(`${dateStr}T${startTime}:00`),
        end: new Date(`${dateStr}T${endTime}:00`),
      }
    } else {
      // Date range: use start/end dates with optional times
      const startDate = request.startDate || request.date || ''
      const endDate = request.endDate || request.date || ''
      const startTime = request.startTime || '00:00'
      const endTime = request.endTime || '23:59'
      
      return {
        start: new Date(`${startDate}T${startTime}:00`),
        end: new Date(`${endDate}T${endTime}:00`),
      }
    }
  }

  /**
   * T073: Normalize existing booking to start/end DateTime
   */
  private normalizeBookingRangeFromBooking(booking: Booking): { start: Date; end: Date } {
    if (booking.bookingMode === 'single-day' && booking.date) {
      const dateStr = booking.date
      const startTime = booking.startTime || '00:00'
      const endTime = booking.endTime || '23:59'
      
      return {
        start: new Date(`${dateStr}T${startTime}:00`),
        end: new Date(`${dateStr}T${endTime}:00`),
      }
    } else {
      const startDate = booking.startDate
      const endDate = booking.endDate
      const startTime = booking.startTime || '00:00'
      const endTime = booking.endTime || '23:59'
      
      return {
        start: new Date(`${startDate}T${startTime}:00`),
        end: new Date(`${endDate}T${endTime}:00`),
      }
    }
  }

  /**
   * T073: Check if two time ranges overlap
   * 
   * Overlap condition: range1.start < range2.end AND range1.end > range2.start
   */
  private rangesOverlap(
    range1: { start: Date; end: Date },
    range2: { start: Date; end: Date }
  ): boolean {
    return range1.start < range2.end && range1.end > range2.start
  }

  /**
   * T074: Validate booking creation (last-write-wins)
   * Returns error message if validation fails
   */
  validateBookingCreate(data: BookingCreate): string | null {
    // Validate dates
    if (data.bookingMode === 'date-range') {
      if (new Date(data.startDate) > new Date(data.endDate)) {
        return 'Start date must be before end date'
      }
    }

    // Validate times
    if (data.startTime && data.endTime) {
      const [startHour, startMin] = data.startTime.split(':').map(Number)
      const [endHour, endMin] = data.endTime.split(':').map(Number)
      if (startHour !== undefined && startMin !== undefined && endHour !== undefined && endMin !== undefined) {
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        if (startMinutes >= endMinutes && data.bookingMode === 'single-day') {
          return 'Start time must be before end time'
        }
      }
    }

    return null
  }
}
