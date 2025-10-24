/**
 * English string constants for booking interface (T098)
 *
 * Centralizes all English text used in the booking system to ensure
 * consistent terminology and easy maintenance.
 */

export const bookingStrings = {
  // Status labels
  status: {
    pending: 'Requested',
    approved: 'Approved',
    active: 'Active',
    completed: 'Completed',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    declined: 'Declined',
  },

  // Actions and buttons
  actions: {
    create: 'Create',
    update: 'Update',
    approve: 'Approve',
    decline: 'Decline',
    cancel: 'Cancel',
    checkOut: 'Check Out',
    checkIn: 'Check In',
    return: 'Return Equipment',
    issue: 'Issue Equipment',
  },

  // Messages and notifications
  messages: {
    bookingApproved: 'Booking has been approved',
    bookingDeclined: 'Booking has been declined',
    equipmentReturned: 'Equipment returned',
    equipmentIssued: 'Equipment issued',
    bookingNotFound: 'Booking not found',
    noBookingsFound: 'No bookings found',
    noBookingsMatchFilters: 'No bookings match the filter criteria.',
    createFirstBooking: 'Create your first booking to reserve equipment.',
    createFirstBookingButton: 'Create First Booking',
  },

  // UI labels
  labels: {
    bookingDetails: 'Booking Details',
    approvedBy: 'Approved by:',
    equipmentKit: 'Equipment Kit:',
    calendarView: 'Calendar view with {count} bookings',
    calendarComingSoon: '(Full calendar integration coming soon)',
  },

  // Form labels and placeholders
  form: {
    bookingFor: 'Booking For',
    bookedBy: 'Booked by:',
    selectAsset: 'Select Asset',
    selectKit: 'Select Kit',
    purpose: 'Purpose',
    notes: 'Notes',
    cancel: 'Cancel',
    update: 'Update',
    create: 'Create',
  },

  // Condition assessment
  condition: {
    title: 'Condition Assessment',
    rating: 'Condition',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    damaged: 'Damaged',
    notes: 'Notes',
    notesPlaceholder: 'Damage, issues, or comments...',
    photos: 'Photos',
    dragImagesHere: 'Drag images here',
    maxSize: 'Max. 5MB',
    photoAlt: 'Photo {number}',
  },
} as const;

/**
 * Type-safe access to booking strings
 */
export type BookingStrings = typeof bookingStrings;