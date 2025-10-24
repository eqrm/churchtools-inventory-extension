/**
 * Photo Storage Factory
 * Feature: Phase 13 - Asset Images and Visual Identification
 * Purpose: Creates the appropriate photo storage implementation based on configuration
 */

import type { IPhotoStorage } from './IPhotoStorage';
// Photo storage implementations are intentionally archived; imports removed to avoid unused symbol warnings.
import type { ChurchToolsAPIClient } from '../api/ChurchToolsAPIClient';

export type PhotoStorageType = 'base64' | 'churchtools-files';

export interface PhotoStorageConfig {
  type: PhotoStorageType;
  moduleId: string;
  apiClient?: ChurchToolsAPIClient;
}

/**
 * Factory for creating photo storage implementations
 */
export function createPhotoStorage(_config: PhotoStorageConfig): IPhotoStorage {
  // Photo storage has been intentionally disabled due to ChurchTools customdata
  // size/line limits. Attempts to create a photo storage implementation will
  // throw a clear error. Keeping this factory helps prevent widespread import
  // errors while making the disabled state explicit at runtime.
  throw new Error('Photo storage is disabled: image attachments were deferred due to ChurchTools customdata size limits.');
}

/**
 * Get the default photo storage configuration
 * Currently uses Base64 storage as the default
 */
export function getDefaultPhotoStorageConfig(
  moduleId: string,
  apiClient: ChurchToolsAPIClient
): PhotoStorageConfig {
  return {
    type: 'base64',
    moduleId,
    apiClient,
  };
}