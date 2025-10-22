/**
 * Photo Storage Service Interface
 * Feature: 002-bug-fixes-ux-improvements (FR-048-052)
 * Purpose: Abstract photo storage operations for dependency injection
 * 
 * This interface defines the contract for photo storage services.
 * Current implementation uses Base64 encoding in ChurchTools data categories.
 * Future implementations can migrate to ChurchTools Files API.
 */

import type { UUID } from '../../types/entities'
import type { PhotoMetadata, CompressionOptions } from '../../types/photo'

export interface IPhotoStorage {
  /**
   * Upload a photo for an asset
   * @param assetId - Asset to attach photo to
   * @param file - Photo file from user upload
   * @param options - Compression options (optional, uses defaults if not provided)
   * @returns Photo metadata including generated ID and URLs
   */
  uploadPhoto(
    assetId: UUID,
    file: File,
    options?: CompressionOptions
  ): Promise<PhotoMetadata>

  /**
   * Get photo metadata by ID
   * @param photoId - Photo ID
   * @returns Photo metadata or null if not found
   */
  getPhoto(photoId: UUID): Promise<PhotoMetadata | null>

  /**
   * Delete a photo
   * @param photoId - Photo ID to delete
   * @returns true if deleted, false if not found
   */
  deletePhoto(photoId: UUID): Promise<boolean>

  /**
   * Set main/featured photo for an asset
   * @param assetId - Asset ID
   * @param photoId - Photo ID to set as main (must belong to asset)
   * @returns true if updated successfully
   */
  setMainPhoto(assetId: UUID, photoId: UUID): Promise<boolean>

  /**
   * Get all photos for an asset
   * @param assetId - Asset ID
   * @returns Array of photo metadata, main photo first
   */
  getAssetPhotos(assetId: UUID): Promise<PhotoMetadata[]>
}
