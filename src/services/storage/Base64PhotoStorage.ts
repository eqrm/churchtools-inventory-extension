/**
 * Base64 Photo Storage Service
 * Feature: Phase 13 - Asset Images and Visual Identification
 * Purpose: Current photo storage implementation using Base64 encoding in ChurchTools data categories
 *
 * This service stores photos as Base64-encoded strings in ChurchTools Custom Module data categories.
 * Future implementations can migrate to ChurchTools Files API.
 */

/**
 * Photo storage is currently disabled.
 *
 * Reason: ChurchTools customdata entries have a hard size/line limit which
 * makes storing images as base64 in customdata unsafe (can exceed limits and
 * cause data corruption). Per project decision, all photo storage features
 * are deferred until a proper Files API integration is available.
 *
 * To keep the repository stable and avoid breaking imports, this file
 * preserves the exported class but all methods throw a clear runtime error
 * explaining that photo features are disabled.
 */

import type { UUID } from '../../types/entities';
import type { IPhotoStorage } from './IPhotoStorage';
import type { PhotoMetadata, CompressionOptions } from '../../types/photo';

export class Base64PhotoStorage implements IPhotoStorage {

  private disabled(): never {
    throw new Error('Photo storage is disabled: storing images in customdata was deferred due to ChurchTools size limits.');
  }

  uploadPhoto(_assetId: UUID, _file: File, _options?: CompressionOptions): Promise<PhotoMetadata> {
    return Promise.reject(this.disabled());
  }

  getPhoto(_photoId: UUID): Promise<PhotoMetadata | null> {
    return Promise.reject(this.disabled());
  }

  deletePhoto(_photoId: UUID): Promise<boolean> {
    return Promise.reject(this.disabled());
  }

  setMainPhoto(_assetId: UUID, _photoId: UUID): Promise<boolean> {
    return Promise.reject(this.disabled());
  }

  getAssetPhotos(_assetId: UUID): Promise<PhotoMetadata[]> {
    return Promise.reject(this.disabled());
  }
}