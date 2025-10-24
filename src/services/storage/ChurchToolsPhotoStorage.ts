/**
 * ChurchTools Photo Storage Service (Stub)
 * Feature: Phase 13 - Asset Images and Visual Identification
 * Purpose: Future photo storage implementation using ChurchTools Files API
 *
 * This is a stub implementation that will be completed when ChurchTools Files API
 * becomes available. Currently throws errors for all operations.
 */

import type { UUID } from '../../types/entities';
import type { IPhotoStorage } from './IPhotoStorage';
import type { PhotoMetadata, CompressionOptions } from '../../types/photo';

export class ChurchToolsPhotoStorage implements IPhotoStorage {
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