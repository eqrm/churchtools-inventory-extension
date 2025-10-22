/**
 * Permission Service Interface
 * Feature: 002-bug-fixes-ux-improvements (FR-010, FR-015-018)
 * Purpose: Abstract permission checks for role-based access control
 * 
 * This interface defines the contract for permission checking.
 * Current implementation (SimplePermissionService) returns true for all checks.
 * Future implementations can integrate with ChurchTools permissions API.
 */

export interface IPermissionService {
  /**
   * Check if current user can book assets on behalf of others
   * FR-010: "Book on behalf of others" feature
   * @returns true if user has permission
   */
  canBookForOthers(): Promise<boolean>

  /**
   * Check if current user can approve/decline booking requests
   * FR-015-018: Booking approval workflow
   * @returns true if user has permission
   */
  canApproveBookings(): Promise<boolean>

  /**
   * Check if current user can cancel any booking
   * FR-019: Cancel bookings feature
   * @returns true if user can cancel any booking (not just their own)
   */
  canCancelAnyBooking(): Promise<boolean>

  /**
   * Check if current user can manage asset categories
   * FR-044: Category management
   * @returns true if user has permission
   */
  canManageCategories(): Promise<boolean>

  /**
   * Check if current user can perform stocktake operations
   * FR-080-082: Stocktake feature
   * @returns true if user has permission
   */
  canPerformStocktake(): Promise<boolean>

  /**
   * Check if current user can view reports
   * FR-033: Reports feature
   * @returns true if user has permission
   */
  canViewReports(): Promise<boolean>

  /**
   * Check if current user can manage kits (bundles)
   * FR-071-075: Kit management
   * @returns true if user has permission
   */
  canManageKits(): Promise<boolean>
}
