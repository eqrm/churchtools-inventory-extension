/**
 * Base64 Photo Storage Service
 * Feature: Phase 13 - Asset Images and Visual Identification
 * Purpose: Current photo storage implementation using Base64 encoding in ChurchTools data categories
 *
 * This service stores photos as Base64-encoded strings in ChurchTools Custom Module data categories.
 * Future implementations can migrate to ChurchTools Files API.
 */

import imageCompression from 'browser-image-compression';
import type { UUID } from '../../types/entities';
import type { IPhotoStorage } from './IPhotoStorage';
import type { PhotoMetadata, CompressionOptions } from '../../types/photo';
import type { ChurchToolsAPIClient } from '../api/ChurchToolsAPIClient';
import { DEFAULT_COMPRESSION_OPTIONS, THUMBNAIL_COMPRESSION_OPTIONS } from '../../types/photo';

export class Base64PhotoStorage implements IPhotoStorage {
  private readonly moduleId: string;
  private readonly apiClient: ChurchToolsAPIClient;

  constructor(moduleId: string, apiClient: ChurchToolsAPIClient) {
    this.moduleId = moduleId;
    this.apiClient = apiClient;
  }

  /**
   * Upload a photo for an asset with compression
   * @param assetId - Asset to attach photo to
   * @param file - Photo file from user upload
   * @param options - Compression options (optional, uses defaults if not provided)
   * @returns Photo metadata including generated ID and URLs
   */
  async uploadPhoto(
    assetId: UUID,
    file: File,
    options?: CompressionOptions
  ): Promise<PhotoMetadata> {
    const user = await this.apiClient.getCurrentUser();
    const photoId = crypto.randomUUID();
    const uploadedAt = new Date().toISOString();

    // Compress full-size image
    const compressionOptions = options || DEFAULT_COMPRESSION_OPTIONS;
    const compressedFile = await imageCompression(file, {
      ...compressionOptions,
      useWebWorker: true,
    });

    // Compress thumbnail
    const thumbnailFile = await imageCompression(file, {
      ...THUMBNAIL_COMPRESSION_OPTIONS,
      useWebWorker: true,
    });

    // Convert to Base64
    const fullSizeBase64 = await this.fileToBase64(compressedFile);
    const thumbnailBase64 = await this.fileToBase64(thumbnailFile);

    // Create photo metadata
    const metadata: PhotoMetadata = {
      id: photoId,
      url: `data:${compressedFile.type};base64,${fullSizeBase64}`,
      thumbnailUrl: `data:${thumbnailFile.type};base64,${thumbnailBase64}`,
      width: compressedFile.width || 0,
      height: compressedFile.height || 0,
      size: compressedFile.size,
      mimeType: compressedFile.type,
      uploadedAt,
      uploadedBy: user.id,
      isMain: false, // Will be set later if needed
    };

    // Store in ChurchTools data category
    await this.storePhotoMetadata(assetId, metadata);

    return metadata;
  }

  /**
   * Get photo metadata by ID
   * @param photoId - Photo ID
   * @returns Photo metadata or null if not found
   */
  async getPhoto(photoId: UUID): Promise<PhotoMetadata | null> {
    const category = await this.getPhotosCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);

    for (const value of values) {
      const raw = value as Record<string, unknown>;
      if (raw['value'] && typeof raw['value'] === 'string') {
        try {
          const metadata = JSON.parse(raw['value']) as PhotoMetadata;
          if (metadata.id === photoId) {
            return metadata;
          }
        } catch (error) {
          console.warn('Error parsing photo metadata:', error);
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Delete a photo
   * @param photoId - Photo ID to delete
   * @returns true if deleted, false if not found
   */
  async deletePhoto(photoId: UUID): Promise<boolean> {
    const category = await this.getPhotosCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);

    for (const value of values) {
      const raw = value as Record<string, unknown>;
      if (raw['value'] && typeof raw['value'] === 'string') {
        try {
          const metadata = JSON.parse(raw['value']) as PhotoMetadata;
          if (metadata.id === photoId) {
            await this.apiClient.deleteDataValue(this.moduleId, category.id, String(raw['id']));
            return true;
          }
        } catch (error) {
          console.warn('Error parsing photo metadata during deletion:', error);
          continue;
        }
      }
    }

    return false;
  }

  /**
   * Set main/featured photo for an asset
   * @param assetId - Asset ID
   * @param photoId - Photo ID to set as main (must belong to asset)
   * @returns true if updated successfully
   */
  async setMainPhoto(assetId: UUID, photoId: UUID): Promise<boolean> {
    const category = await this.getPhotosCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);

    let found = false;
    for (const value of values) {
      const raw = value as Record<string, unknown>;
      if (raw['value'] && typeof raw['value'] === 'string') {
        try {
          const metadata = JSON.parse(raw['value']) as PhotoMetadata & { assetId: UUID };
          if (metadata.assetId === assetId) {
            // Update isMain flag
            const updatedMetadata = { ...metadata, isMain: metadata.id === photoId };

            const dataValue = {
              id: Number(raw['id']),
              dataCategoryId: Number(category.id),
              value: JSON.stringify(updatedMetadata),
            };

            await this.apiClient.updateDataValue(this.moduleId, category.id, String(raw['id']), dataValue);
            found = true;
          }
        } catch (error) {
          console.warn('Error parsing photo metadata during main photo update:', error);
          continue;
        }
      }
    }

    return found;
  }

  /**
   * Get all photos for an asset
   * @param assetId - Asset ID
   * @returns Array of photo metadata, main photo first
   */
  async getAssetPhotos(assetId: UUID): Promise<PhotoMetadata[]> {
    const category = await this.getPhotosCategory();
    const values = await this.apiClient.getDataValues(this.moduleId, category.id);

    const photos: PhotoMetadata[] = [];

    for (const value of values) {
      const raw = value as Record<string, unknown>;
      if (raw['value'] && typeof raw['value'] === 'string') {
        try {
          const metadata = JSON.parse(raw['value']) as PhotoMetadata & { assetId: UUID };
          if (metadata.assetId === assetId) {
            photos.push(metadata);
          }
        } catch (error) {
          console.warn('Error parsing photo metadata:', error);
          continue;
        }
      }
    }

    // Sort with main photo first
    return photos.sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      // Then by upload date (newest first)
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
  }

  /**
   * Get or create the photos storage category
   */
  private async getPhotosCategory(): Promise<{ id: string; name: string }> {
    const categories = await this.apiClient.getDataCategories(this.moduleId);
    let photosCategory = categories.find(cat => cat.name === '__AssetPhotos__');

    if (!photosCategory) {
      // Create the photos category
      const shorty = 'photos_' + Date.now().toString().substring(-4);

      const categoryData = {
        customModuleId: Number(this.moduleId),
        name: '__AssetPhotos__',
        shorty,
        description: 'Internal category for asset photos',
        data: null,
      };

      const created = await this.apiClient.createDataCategory(this.moduleId, categoryData);
      photosCategory = created as { id: string; name: string };
    }

    return photosCategory;
  }

  /**
   * Store photo metadata in ChurchTools
   */
  private async storePhotoMetadata(assetId: UUID, metadata: PhotoMetadata): Promise<void> {
    const category = await this.getPhotosCategory();

    // Add assetId to metadata for filtering
    const storageMetadata = { ...metadata, assetId };

    const dataValue = {
      dataCategoryId: Number(category.id),
      value: JSON.stringify(storageMetadata),
    };

    await this.apiClient.createDataValue(this.moduleId, category.id, dataValue);
  }

  /**
   * Convert File to Base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}