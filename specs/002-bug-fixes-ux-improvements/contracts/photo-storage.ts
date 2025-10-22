/**
 * Photo Storage API Contract
 * 
 * Addresses: T327 - Multiple asset photos, T328 - Photo compression
 * Related Requirements: FR-050, FR-051, FR-052, FR-052a (Clarification Q4)
 * Storage Strategy: Abstraction layer supporting base64 (current) + ChurchTools Files (future)
 * 
 * This contract defines the interface for storing, retrieving, and managing
 * asset photos with abstraction supporting multiple storage backends.
 */

// ==================== Request Types ====================

/**
 * Request to upload a photo
 */
export interface UploadPhotoRequest {
  /** Photo file to upload */
  file: File;
  
  /** Asset ID this photo belongs to */
  assetId: string;
  
  /** Should compress photo? (default: true) */
  compress?: boolean;
  
  /** Compression options (Per Clarification Q4) */
  compressionOptions?: CompressionOptions;
}

/**
 * Photo compression options (Per Clarification Q4)
 */
export interface CompressionOptions {
  /** Generate thumbnail? (default: true) */
  generateThumbnail: boolean;
  
  /** Thumbnail quality (0-1, default: 0.7) */
  thumbnailQuality: number;
  
  /** Thumbnail max width in pixels (default: 400) */
  thumbnailMaxWidth: number;
  
  /** Full-size quality (0-1, default: 0.85) */
  fullSizeQuality: number;
  
  /** Full-size max width in pixels (default: 2048) */
  fullSizeMaxWidth: number;
  
  /** Output format (default: 'jpeg') */
  format: 'jpeg' | 'png' | 'webp';
}

/**
 * Request to delete a photo
 */
export interface DeletePhotoRequest {
  /** Photo ID to delete */
  photoId: string;
  
  /** Asset ID (for validation) */
  assetId: string;
  
  /** Delete all versions (thumbnail + full-size)? */
  deleteAllVersions: boolean;
}

/**
 * Request to set main photo
 */
export interface SetMainPhotoRequest {
  /** Asset ID */
  assetId: string;
  
  /** Photo ID to set as main */
  photoId: string;
}

// ==================== Response Types ====================

/**
 * Response from photo upload
 */
export interface UploadPhotoResponse {
  success: boolean;
  
  /** Uploaded photo metadata */
  photo?: PhotoMetadata;
  
  error?: {
    code: PhotoErrorCode;
    message: string;
  };
}

/**
 * Photo metadata
 */
export interface PhotoMetadata {
  /** Unique photo ID */
  id: string;
  
  /** Asset ID */
  assetId: string;
  
  /** Original photo ID (before compression) */
  originalId?: string;
  
  /** Thumbnail photo ID (if generated) */
  thumbnailId?: string;
  
  /** Full-size photo ID (if compressed) */
  fullSizeId?: string;
  
  /** Original file size in bytes */
  originalSize: number;
  
  /** Thumbnail size in bytes (if generated) */
  thumbnailSize?: number;
  
  /** Full-size size in bytes (if compressed) */
  fullSizeSize?: number;
  
  /** Image format */
  format: 'jpeg' | 'png' | 'webp';
  
  /** Image dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  
  /** When uploaded */
  uploadedAt: Date;
  
  /** Schema version */
  schemaVersion: string;
}

/**
 * Response from photo deletion
 */
export interface DeletePhotoResponse {
  success: boolean;
  
  /** Number of versions deleted (1 for original only, 2-3 with thumbnail/full-size) */
  deletedCount?: number;
  
  error?: {
    code: PhotoErrorCode;
    message: string;
  };
}

// ==================== Error Types ====================

export type PhotoErrorCode =
  | 'FILE_TOO_LARGE'           // Exceeds max file size
  | 'INVALID_FORMAT'           // Not a supported image format
  | 'COMPRESSION_FAILED'       // Compression error
  | 'STORAGE_FAILED'           // Failed to store photo
  | 'PHOTO_NOT_FOUND'          // Photo ID doesn't exist
  | 'ASSET_NOT_FOUND'          // Asset doesn't exist
  | 'MAX_PHOTOS_EXCEEDED'      // Asset has 10 photos already
  | 'PERMISSION_DENIED';       // User can't modify asset photos

// ==================== Service Interface ====================

/**
 * Photo storage service interface (Abstraction)
 */
export interface IPhotoStorageService {
  /**
   * Upload a photo
   * 
   * Per Clarification Q4: Two-tier compression
   * - Thumbnail: 70% quality, 400px max width
   * - Full-size: 85% quality, 2048px max width
   * 
   * @param request Upload request
   * @returns Promise resolving to upload result with metadata
   */
  uploadPhoto(request: UploadPhotoRequest): Promise<UploadPhotoResponse>;
  
  /**
   * Get photo URL for display
   * 
   * @param photoId Photo ID (base64 or file ID)
   * @param size Which version to retrieve
   * @returns URL or data URL for display
   */
  getPhotoUrl(photoId: string, size: 'thumbnail' | 'full-size' | 'original'): string;
  
  /**
   * Delete a photo
   * 
   * @param request Delete request
   * @returns Promise resolving to deletion result
   */
  deletePhoto(request: DeletePhotoRequest): Promise<DeletePhotoResponse>;
  
  /**
   * Get all photos for an asset
   * 
   * @param assetId Asset ID
   * @returns Promise resolving to array of photo metadata
   */
  getAssetPhotos(assetId: string): Promise<PhotoMetadata[]>;
  
  /**
   * Set main photo for an asset
   * 
   * @param request Set main photo request
   * @returns Promise resolving to success
   */
  setMainPhoto(request: SetMainPhotoRequest): Promise<boolean>;
  
  /**
   * Check if photo is stored as base64 (legacy format)
   * 
   * @param photoId Photo ID
   * @returns True if base64, false if ChurchTools file ID
   */
  isBase64Photo(photoId: string): boolean;
}

// ==================== Storage Backend Interface ====================

/**
 * Storage backend interface (for abstraction implementations)
 */
export interface IPhotoStorageBackend {
  /**
   * Store photo data
   * 
   * @param data Photo data (File or Blob)
   * @param metadata Photo metadata
   * @returns Promise resolving to photo ID
   */
  store(data: Blob, metadata: Partial<PhotoMetadata>): Promise<string>;
  
  /**
   * Retrieve photo data
   * 
   * @param photoId Photo ID
   * @returns Promise resolving to photo URL or data URL
   */
  retrieve(photoId: string): Promise<string>;
  
  /**
   * Delete photo data
   * 
   * @param photoId Photo ID
   * @returns Promise resolving to success
   */
  delete(photoId: string): Promise<boolean>;
  
  /**
   * Check if backend can handle this photo ID
   * 
   * @param photoId Photo ID
   * @returns True if this backend handles this ID format
   */
  canHandle(photoId: string): boolean;
}

// ==================== Implementation: Base64 Storage ====================

/**
 * Base64 storage backend (current implementation)
 * 
 * Stores photos inline in Asset JSON as base64 data URLs.
 */
export class Base64PhotoStorageBackend implements IPhotoStorageBackend {
  async store(data: Blob, metadata: Partial<PhotoMetadata>): Promise<string> {
    // Convert blob to base64 data URL
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(data);
    });
  }
  
  async retrieve(photoId: string): Promise<string> {
    // Base64 data URL is the ID itself
    return photoId;
  }
  
  async delete(photoId: string): Promise<boolean> {
    // No-op for base64 (deleted from Asset JSON)
    return true;
  }
  
  canHandle(photoId: string): boolean {
    // Check if starts with data:image/
    return photoId.startsWith('data:image/');
  }
}

// ==================== Implementation: ChurchTools Files ====================

/**
 * ChurchTools Files storage backend (future implementation)
 * 
 * Uploads photos to ChurchTools Files module, stores only file IDs in Asset JSON.
 */
export class ChurchToolsPhotoStorageBackend implements IPhotoStorageBackend {
  constructor(private apiClient: any) {}
  
  async store(data: Blob, metadata: Partial<PhotoMetadata>): Promise<string> {
    // Upload to ChurchTools Files API
    const formData = new FormData();
    formData.append('file', data, `asset-${metadata.assetId}-photo.jpg`);
    
    const response = await this.apiClient.post('/api/files', formData);
    return response.data.id; // Returns file ID (e.g., "file-123")
  }
  
  async retrieve(photoId: string): Promise<string> {
    // Return ChurchTools file URL
    return `/api/files/${photoId}/content`;
  }
  
  async delete(photoId: string): Promise<boolean> {
    // Delete from ChurchTools Files API
    await this.apiClient.delete(`/api/files/${photoId}`);
    return true;
  }
  
  canHandle(photoId: string): boolean {
    // Check if starts with file- or is numeric ID
    return photoId.startsWith('file-') || /^\d+$/.test(photoId);
  }
}

// ==================== Compression Implementation ====================

/**
 * COMPRESSION IMPLEMENTATION (Per Clarification Q4):
 * 
 * Using: browser-image-compression library (~15KB)
 * 
 * Two-tier compression:
 * 
 * 1. Thumbnail (for galleries, lists):
 *    - Quality: 70%
 *    - Max width: 400px
 *    - Format: JPEG
 *    - Use case: Asset lists, kit cards, search results
 *    - Expected size: ~20-50KB
 * 
 * 2. Full-size (for detail views):
 *    - Quality: 85%
 *    - Max width: 2048px
 *    - Format: JPEG
 *    - Use case: Asset detail page, lightbox view
 *    - Expected size: ~100-300KB
 * 
 * Original photo: Discarded after compression (not stored)
 * 
 * Example code:
 * 
 * ```typescript
 * import imageCompression from 'browser-image-compression';
 * 
 * // Generate thumbnail
 * const thumbnail = await imageCompression(file, {
 *   maxWidthOrHeight: 400,
 *   quality: 0.7,
 *   fileType: 'image/jpeg'
 * });
 * 
 * // Generate full-size
 * const fullSize = await imageCompression(file, {
 *   maxWidthOrHeight: 2048,
 *   quality: 0.85,
 *   fileType: 'image/jpeg'
 * });
 * 
 * // Store both versions
 * const thumbnailId = await backend.store(thumbnail, { assetId, type: 'thumbnail' });
 * const fullSizeId = await backend.store(fullSize, { assetId, type: 'full-size' });
 * 
 * return {
 *   thumbnailId,
 *   fullSizeId,
 *   thumbnailSize: thumbnail.size,
 *   fullSizeSize: fullSize.size
 * };
 * ```
 */

// ==================== Migration Strategy ====================

/**
 * MIGRATION STRATEGY:
 * 
 * Goal: Gradual migration from base64 to ChurchTools Files without breaking changes
 * 
 * Phase 1: Add abstraction layer (current state)
 * - IPhotoStorageService interface
 * - Base64PhotoStorageBackend (current default)
 * - ChurchToolsPhotoStorageBackend (future)
 * 
 * Phase 2: Dual storage support
 * - Check photo ID format to determine backend
 * - If starts with "data:image/": Use Base64Backend
 * - If starts with "file-" or numeric: Use ChurchToolsBackend
 * - New uploads can use either backend (config-driven)
 * 
 * Phase 3: Migration script (optional, manual)
 * - Admin runs "Migrate Photos to Files" task
 * - Iterates all assets with base64 photos
 * - Uploads each photo to ChurchTools Files
 * - Replaces base64 ID with file ID in Asset JSON
 * - Verifies all photos accessible after migration
 * - Can run incrementally (batch of 100 assets at a time)
 * 
 * Phase 4: Deprecate base64 (future)
 * - New uploads always use ChurchTools Files
 * - Base64 photos still work (read-only)
 * - Show migration notice in UI for assets with base64 photos
 * 
 * No breaking changes: All existing base64 photos continue working indefinitely.
 */

// ==================== Implementation Notes ====================

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Storage Limits:
 *    - Max photos per asset: 10
 *    - Max file size (before compression): 10MB
 *    - Supported formats: JPEG, PNG, WebP
 *    - Unsupported formats: GIF (no animation), BMP, TIFF
 * 
 * 2. Compression Performance:
 *    - Runs in main thread (browser-image-compression)
 *    - Show progress indicator for large files
 *    - Estimated time: ~1-2 seconds per photo (5MB original)
 * 
 * 3. Error Handling:
 *    - File too large: Show error before upload
 *    - Compression failed: Retry once, then upload uncompressed
 *    - Storage failed: Show error, allow retry
 *    - Network errors: Retry with exponential backoff
 * 
 * 4. UI/UX:
 *    - Thumbnail preview: Use thumbnail version for lists
 *    - Lightbox view: Use full-size version
 *    - Upload progress: Show compression + upload progress
 *    - Drag-and-drop: Support multiple file upload (up to 10)
 *    - Reorder photos: Drag-and-drop to change order
 *    - Set main photo: Click star icon on photo
 * 
 * 5. Performance Optimization:
 *    - Lazy load full-size images (only when lightbox opened)
 *    - Cache thumbnails in browser cache (1 week)
 *    - Preload next/previous photos in lightbox (UX)
 *    - Use IntersectionObserver for lazy loading
 * 
 * 6. Testing:
 *    - Test compression with various image sizes (1MB, 5MB, 10MB)
 *    - Test compression with various formats (JPEG, PNG, WebP)
 *    - Test base64 vs Files backend selection
 *    - Test migration from base64 to Files
 *    - Test max photos limit (10)
 *    - Test photo deletion (remove from Asset JSON)
 */

// ==================== Example Usage ====================

/**
 * Example: Upload and compress a photo
 * 
 * ```typescript
 * const service: IPhotoStorageService = new PhotoStorageService();
 * 
 * // Upload with default compression (Per Clarification Q4)
 * const file = event.target.files[0]; // File from input
 * 
 * const result = await service.uploadPhoto({
 *   file,
 *   assetId: 'asset-123',
 *   compress: true,
 *   compressionOptions: {
 *     generateThumbnail: true,
 *     thumbnailQuality: 0.7,
 *     thumbnailMaxWidth: 400,
 *     fullSizeQuality: 0.85,
 *     fullSizeMaxWidth: 2048,
 *     format: 'jpeg'
 *   }
 * });
 * 
 * if (result.success) {
 *   console.log(`Uploaded photo: ${result.photo.id}`);
 *   console.log(`Original size: ${result.photo.originalSize} bytes`);
 *   console.log(`Thumbnail size: ${result.photo.thumbnailSize} bytes`);
 *   console.log(`Full-size size: ${result.photo.fullSizeSize} bytes`);
 *   console.log(`Compression ratio: ${(result.photo.thumbnailSize / result.photo.originalSize * 100).toFixed(1)}%`);
 * }
 * ```
 * 
 * Example: Display photos in asset gallery
 * 
 * ```typescript
 * const photos = await service.getAssetPhotos('asset-123');
 * 
 * // Display thumbnails in gallery
 * photos.forEach(photo => {
 *   const thumbnailUrl = service.getPhotoUrl(photo.thumbnailId, 'thumbnail');
 *   console.log(`<img src="${thumbnailUrl}" alt="Asset photo" />`);
 * });
 * 
 * // On thumbnail click: Show full-size in lightbox
 * const fullSizeUrl = service.getPhotoUrl(photo.fullSizeId, 'full-size');
 * console.log(`<img src="${fullSizeUrl}" alt="Asset photo full size" />`);
 * ```
 * 
 * Example: Set main photo
 * 
 * ```typescript
 * await service.setMainPhoto({
 *   assetId: 'asset-123',
 *   photoId: 'photo-456'
 * });
 * 
 * console.log('Main photo updated');
 * ```
 * 
 * Example: Delete photo
 * 
 * ```typescript
 * await service.deletePhoto({
 *   photoId: 'photo-456',
 *   assetId: 'asset-123',
 *   deleteAllVersions: true  // Delete thumbnail + full-size
 * });
 * 
 * console.log('Photo deleted');
 * ```
 */
