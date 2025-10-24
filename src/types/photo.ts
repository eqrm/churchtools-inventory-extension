/**
 * Photo storage and compression types
 * Feature: 002-bug-fixes-ux-improvements (FR-048-052)
 * Purpose: Manage multiple images per asset with compression
 */

import type { UUID, ISOTimestamp } from './entities'

/**
 * Photo metadata stored with each asset
 * Matches contracts/photo-storage.ts specification
 */
export interface PhotoMetadata {
  id: UUID
  url: string
  thumbnailUrl?: string
  width: number
  height: number
  size: number  // bytes
  mimeType: string  // 'image/jpeg', 'image/png', etc.
  uploadedAt: ISOTimestamp
  uploadedBy: string  // Person ID
  isMain: boolean  // FR-049: Featured/main image
}

/**
 * Options for image compression before upload
 * Used by browser-image-compression library
 */
export interface CompressionOptions {
  quality: number  // 0.0 to 1.0
  maxWidth: number  // pixels
  maxHeight: number  // pixels
  format?: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * Default compression settings for asset photos
 * Referenced in contracts/photo-storage.ts
 */
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'image/jpeg'
}

/**
 * Thumbnail compression settings
 */
export const THUMBNAIL_COMPRESSION_OPTIONS: CompressionOptions = {
  quality: 0.7,
  maxWidth: 300,
  maxHeight: 300,
  format: 'image/jpeg'
}
