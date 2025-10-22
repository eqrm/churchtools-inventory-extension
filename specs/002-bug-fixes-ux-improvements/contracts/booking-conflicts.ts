/**
 * Booking Conflicts API Contract
 * 
 * Addresses: T307 - Booking conflict detection
 * Related Requirements: FR-016, FR-016a (Clarification Q1)
 * Conflict Resolution Strategy: Last-write-wins with validation
 * 
 * This contract defines the interface for detecting and resolving
 * booking conflicts when multiple users try to book the same asset.
 */

// ==================== Request Types ====================

/**
 * Request to check for booking conflicts
 */
export interface CheckConflictRequest {
  /** Asset ID to check */
  assetId: string;
  
  /** Booking mode */
  bookingMode: 'single-day' | 'date-range';
  
  /** Single day fields */
  date?: Date;
  startTime?: string;    // "HH:mm"
  endTime?: string;      // "HH:mm"
  
  /** Date range fields */
  startDate?: Date;
  endDate?: Date;
  startDateTime?: string; // Optional "HH:mm"
  endDateTime?: string;   // Optional "HH:mm"
  
  /** Exclude this booking ID from conflict check (for edits) */
  excludeBookingId?: string;
}

/**
 * Request to create a booking (with conflict validation)
 */
export interface CreateBookingRequest {
  assetId: string;
  bookedById: string;      // Person creating booking
  bookingForId: string;    // Person using asset (can be same)
  
  bookingMode: 'single-day' | 'date-range';
  
  // Single day
  date?: Date;
  startTime?: string;
  endTime?: string;
  
  // Date range
  startDate?: Date;
  endDate?: Date;
  startDateTime?: string;
  endDateTime?: string;
  
  purpose: string;
  notes?: string;
}

// ==================== Response Types ====================

/**
 * A detected booking conflict
 */
export interface BookingConflict {
  /** ID of conflicting booking */
  conflictingBookingId: string;
  
  /** Asset ID */
  assetId: string;
  
  /** When conflicting booking starts */
  conflictStart: Date;
  
  /** When conflicting booking ends */
  conflictEnd: Date;
  
  /** Person who booked */
  bookedBy: string;       // Person ID
  
  /** Person using asset */
  bookingFor: string;     // Person ID
  
  /** Overlap period in hours */
  overlapHours: number;
  
  /** Status of conflicting booking */
  status: 'requested' | 'pending' | 'approved' | 'active';
}

/**
 * Response from conflict check
 */
export interface CheckConflictResponse {
  /** Whether conflicts were found */
  hasConflicts: boolean;
  
  /** Array of conflicts (empty if none) */
  conflicts: BookingConflict[];
  
  /** Asset availability summary */
  availability: {
    /** Is asset bookable at all? */
    isBookable: boolean;
    
    /** If not bookable, reason why */
    unbookableReason?: 'asset-not-bookable' | 'asset-maintenance' | 'asset-retired';
    
    /** Next available date (if currently unavailable) */
    nextAvailableDate?: Date;
  };
}

/**
 * Response from booking creation
 */
export interface CreateBookingResponse {
  /** Success flag */
  success: boolean;
  
  /** Created booking ID (if success) */
  bookingId?: string;
  
  /** Error if failed */
  error?: BookingConflictError;
}

// ==================== Error Types ====================

/**
 * Booking conflict error codes (Clarification Q1: Last-write-wins)
 */
export type ConflictErrorCode =
  | 'CONFLICT_DETECTED'          // Conflicts found during validation
  | 'ASSET_NOT_BOOKABLE'         // Asset has bookable=false
  | 'INVALID_DATE_RANGE'         // Start after end, or in past
  | 'INVALID_TIME_RANGE'         // Start time after end time
  | 'ASSET_NOT_FOUND'            // Asset doesn't exist
  | 'PERSON_NOT_FOUND'           // Booked by/for person invalid
  | 'VALIDATION_FAILED';         // Other validation failure

/**
 * Error during booking creation
 */
export interface BookingConflictError {
  code: ConflictErrorCode;
  message: string;
  conflicts?: BookingConflict[];
  details?: any;
}

// ==================== Service Interface ====================

/**
 * Booking conflict service interface
 */
export interface IBookingConflictService {
  /**
   * Check for conflicts before creating/updating a booking
   * 
   * Per Clarification Q1: Last-write-wins strategy
   * - No optimistic locking
   * - Conflicts detected at submission time
   * - Clear error message if conflicts exist
   * 
   * @param request Conflict check parameters
   * @returns Promise resolving to conflict check results
   */
  checkConflicts(request: CheckConflictRequest): Promise<CheckConflictResponse>;
  
  /**
   * Create a booking with conflict validation
   * 
   * Per Clarification Q1: Validation at submission
   * - Checks conflicts immediately before creating
   * - Returns 409 Conflict if conflicts exist
   * - No held reservations or time windows
   * 
   * @param request Booking creation parameters
   * @returns Promise resolving to creation result
   * @throws BookingConflictError if conflicts detected
   */
  createBooking(request: CreateBookingRequest): Promise<CreateBookingResponse>;
  
  /**
   * Get all bookings for an asset (for calendar view)
   * 
   * @param assetId Asset ID
   * @param startDate Start of date range
   * @param endDate End of date range
   * @returns Promise resolving to array of bookings
   */
  getAssetBookings(
    assetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BookingInfo[]>;
}

// ==================== Supporting Types ====================

/**
 * Booking information for calendar display
 */
export interface BookingInfo {
  id: string;
  assetId: string;
  bookedBy: string;
  bookingFor: string;
  
  bookingMode: 'single-day' | 'date-range';
  
  // Normalized start/end (computed for calendar)
  startDateTime: Date;
  endDateTime: Date;
  
  status: 'requested' | 'pending' | 'approved' | 'declined' | 'cancelled' | 'active' | 'completed';
  purpose: string;
}

// ==================== Conflict Detection Algorithm ====================

/**
 * CONFLICT DETECTION ALGORITHM:
 * 
 * Two bookings conflict if their time ranges overlap:
 * 
 * Overlap condition:
 * ```
 * booking1.start < booking2.end AND booking1.end > booking2.start
 * ```
 * 
 * Examples:
 * 
 * 1. Complete overlap:
 *    Booking A: ████████████
 *    Booking B:   ██████
 *    → CONFLICT (6 hours overlap)
 * 
 * 2. Partial overlap:
 *    Booking A: ████████
 *    Booking B:       ████████
 *    → CONFLICT (4 hours overlap)
 * 
 * 3. Adjacent (no overlap):
 *    Booking A: ████████
 *    Booking B:         ████████
 *    → NO CONFLICT (0 hours overlap)
 * 
 * 4. Same start/end times:
 *    Booking A: ████████████
 *    Booking B: ████████████
 *    → CONFLICT (entire duration overlap)
 * 
 * Date Normalization:
 * - Single-day mode: Combine date + startTime/endTime → DateTime
 * - Date-range mode: Use startDate/endDate with optional times
 * - If no times specified in date-range: Assume 00:00-23:59
 */

// ==================== Implementation Notes ====================

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Validation Flow (Per Clarification Q1):
 *    a. User fills booking form
 *    b. User clicks "Create Booking"
 *    c. Frontend calls checkConflicts()
 *    d. If conflicts found: Show error, list conflicts, prevent creation
 *    e. If no conflicts: Call createBooking()
 *    f. Backend validates again (race condition protection)
 *    g. If race condition (conflicts appeared): Return 409 Conflict
 *    h. If still no conflicts: Create booking, return success
 * 
 * 2. Race Condition Handling:
 *    - Frontend check: Advisory (UX optimization)
 *    - Backend check: Authoritative (data integrity)
 *    - If conflict appears between checks: User sees error, can retry
 *    - No optimistic locking or held reservations
 * 
 * 3. Conflict Resolution Strategy (Clarification Q1):
 *    - Last-write-wins: Second booking attempt fails
 *    - User sees clear error: "Asset already booked for {dates} by {person}"
 *    - User can: (a) Choose different dates, (b) Contact conflicting user, (c) Cancel
 *    - No automatic conflict resolution
 * 
 * 4. Performance Optimization:
 *    - Index bookings by assetId + startDate
 *    - Query only bookings in relevant date range
 *    - Exclude declined/cancelled bookings from conflict check
 *    - Cache asset bookability flag
 * 
 * 5. Edge Cases:
 *    - Booking in past: Reject with INVALID_DATE_RANGE
 *    - Start after end: Reject with INVALID_TIME_RANGE
 *    - Asset not bookable: Reject with ASSET_NOT_BOOKABLE
 *    - Editing existing booking: Exclude own booking ID from conflict check
 *    - Simultaneous submissions: Last one fails (race condition)
 * 
 * 6. Testing:
 *    - Test overlap detection algorithm (complete, partial, adjacent)
 *    - Test race condition handling (concurrent submissions)
 *    - Test all error codes (asset not found, invalid dates, etc.)
 *    - Test date normalization (single-day vs date-range)
 */

// ==================== Example Usage ====================

/**
 * Example: Check for conflicts before creating booking
 * 
 * ```typescript
 * const service: IBookingConflictService = new BookingConflictService();
 * 
 * // Check for conflicts
 * const conflictCheck = await service.checkConflicts({
 *   assetId: 'asset-123',
 *   bookingMode: 'single-day',
 *   date: new Date('2025-01-15'),
 *   startTime: '09:00',
 *   endTime: '17:00'
 * });
 * 
 * if (conflictCheck.hasConflicts) {
 *   console.log(`Found ${conflictCheck.conflicts.length} conflicts:`);
 *   conflictCheck.conflicts.forEach(conflict => {
 *     console.log(`- Booked by ${conflict.bookedBy} from ${conflict.conflictStart} to ${conflict.conflictEnd}`);
 *   });
 *   // Show error to user, prevent booking
 * } else {
 *   // Proceed with booking
 *   const result = await service.createBooking({
 *     assetId: 'asset-123',
 *     bookedById: 'person-456',
 *     bookingForId: 'person-789',
 *     bookingMode: 'single-day',
 *     date: new Date('2025-01-15'),
 *     startTime: '09:00',
 *     endTime: '17:00',
 *     purpose: 'Team event'
 *   });
 *   
 *   if (result.success) {
 *     console.log(`Booking created: ${result.bookingId}`);
 *   } else {
 *     // Race condition: conflicts appeared between check and creation
 *     console.error(`Booking failed: ${result.error?.message}`);
 *   }
 * }
 * ```
 * 
 * Example: Get asset bookings for calendar view
 * 
 * ```typescript
 * const bookings = await service.getAssetBookings(
 *   'asset-123',
 *   new Date('2025-01-01'),
 *   new Date('2025-01-31')
 * );
 * 
 * bookings.forEach(booking => {
 *   console.log(`${booking.startDateTime} - ${booking.endDateTime}: ${booking.purpose}`);
 * });
 * ```
 */
