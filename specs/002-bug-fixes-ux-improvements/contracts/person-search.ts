/**
 * Person Search API Contract
 * 
 * Addresses: T301 - Real person search in booking forms
 * Related Requirements: FR-008, FR-009
 * 
 * This contract defines the interface for searching ChurchTools person records
 * via the /api/search endpoint and caching results for performance.
 */

// ==================== Request Types ====================

/**
 * Request to search for persons in ChurchTools
 */
export interface PersonSearchRequest {
  /** Search query (matches first name, last name, email) */
  query: string;
  
  /** Maximum number of results to return (default: 10) */
  limit?: number;
  
  /** Whether to include person avatars (default: true) */
  includeAvatars?: boolean;
}

// ==================== Response Types ====================

/**
 * Single person result from search
 */
export interface PersonSearchResult {
  /** ChurchTools person ID */
  id: string;
  
  /** Person's first name */
  firstName: string;
  
  /** Person's last name */
  lastName: string;
  
  /** Person's email address (if available) */
  email?: string;
  
  /** URL to person's avatar image (if available) */
  avatarUrl?: string;
  
  /** Full display name (computed: "firstName lastName") */
  displayName: string;
}

/**
 * Response from person search endpoint
 */
export interface PersonSearchResponse {
  /** Array of matching persons */
  results: PersonSearchResult[];
  
  /** Total count of results (before limit applied) */
  totalCount: number;
  
  /** Whether results were served from cache */
  fromCache: boolean;
  
  /** Search query that was executed */
  query: string;
}

// ==================== Error Types ====================

/**
 * Error during person search
 */
export interface PersonSearchError {
  code: 'SEARCH_FAILED' | 'INVALID_QUERY' | 'NETWORK_ERROR' | 'UNAUTHORIZED';
  message: string;
  details?: any;
}

// ==================== Service Interface ====================

/**
 * Person search service interface
 */
export interface IPersonSearchService {
  /**
   * Search for persons in ChurchTools
   * 
   * @param request Search request parameters
   * @returns Promise resolving to search results
   * @throws PersonSearchError on failure
   */
  search(request: PersonSearchRequest): Promise<PersonSearchResponse>;
  
  /**
   * Get a specific person by ID
   * 
   * @param personId ChurchTools person ID
   * @returns Promise resolving to person details
   * @throws PersonSearchError if person not found
   */
  getPersonById(personId: string): Promise<PersonSearchResult>;
  
  /**
   * Clear cached person search results
   */
  clearCache(): void;
  
  /**
   * Pre-cache frequently used persons (e.g., current user, recent bookings)
   * 
   * @param personIds Array of person IDs to cache
   */
  warmCache(personIds: string[]): Promise<void>;
}

// ==================== ChurchTools API Types ====================

/**
 * Raw person object from ChurchTools /api/search endpoint
 */
export interface ChurchToolsPersonRaw {
  id: number;
  type: 'person';
  title: string;          // "firstName lastName"
  domainType: 'person';
  domainIdentifier: string; // Person ID as string
  apiUrl: string;         // "/api/persons/{id}"
  frontendUrl: string;    // Frontend URL
  imageUrl?: string;      // Avatar URL
  meta?: {
    email?: string;
  };
}

/**
 * Raw search response from ChurchTools /api/search
 */
export interface ChurchToolsSearchResponse {
  data: ChurchToolsPersonRaw[];
  meta: {
    count: number;
    pagination: {
      total: number;
      current: number;
      limit: number;
    };
  };
}

// ==================== Cache Types ====================

/**
 * Cached person entry
 */
export interface CachedPerson {
  person: PersonSearchResult;
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * Cache configuration
 */
export interface PersonCacheConfig {
  /** In-memory cache TTL (milliseconds, default: 5 minutes) */
  memoryTTL: number;
  
  /** LocalStorage cache TTL (milliseconds, default: 24 hours) */
  storageTTL: number;
  
  /** Maximum number of entries in memory cache (default: 100) */
  maxMemoryEntries: number;
}

// ==================== Implementation Notes ====================

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. ChurchTools Search Endpoint:
 *    - URL: GET /api/search?query={query}&domain_types[]=person
 *    - Returns persons matching query in title, email, or ID
 *    - Requires valid session (handled by ChurchTools auth)
 * 
 * 2. Caching Strategy:
 *    - Level 1 (Memory): Map<string, CachedPerson> with 5-minute TTL
 *    - Level 2 (LocalStorage): "person_cache_{id}" keys with 24-hour TTL
 *    - On search: Check memory → localStorage → API
 *    - On getPersonById: Check memory → localStorage → API
 * 
 * 3. Response Transformation:
 *    - ChurchToolsPersonRaw → PersonSearchResult
 *    - Extract firstName/lastName from title (split on space)
 *    - Use imageUrl as avatarUrl
 *    - Use id as string
 *    - Compute displayName = `${firstName} ${lastName}`
 * 
 * 4. Error Handling:
 *    - 401/403 → UNAUTHORIZED (session expired)
 *    - 400 → INVALID_QUERY (malformed query)
 *    - Network errors → NETWORK_ERROR
 *    - Other → SEARCH_FAILED with details
 * 
 * 5. Performance:
 *    - Debounce search input (300ms) in UI
 *    - Minimum 2 characters before searching
 *    - Cache warm-up on app load for current user
 *    - Lazy load avatars (show placeholder until loaded)
 * 
 * 6. Testing:
 *    - Mock ChurchTools API responses
 *    - Test cache hit/miss scenarios
 *    - Test cache expiration
 *    - Test error handling (network failures, invalid responses)
 */

// ==================== Example Usage ====================

/**
 * Example: Search for persons
 * 
 * ```typescript
 * const service: IPersonSearchService = new PersonSearchService(config);
 * 
 * // Search for "John"
 * const results = await service.search({ query: 'John', limit: 10 });
 * 
 * console.log(`Found ${results.totalCount} persons`);
 * results.results.forEach(person => {
 *   console.log(`${person.displayName} (${person.email})`);
 * });
 * ```
 * 
 * Example: Get specific person by ID
 * 
 * ```typescript
 * const person = await service.getPersonById('123');
 * console.log(`Person: ${person.displayName}`);
 * ```
 * 
 * Example: Warm cache with recent booking persons
 * 
 * ```typescript
 * const recentBookingPersonIds = ['123', '456', '789'];
 * await service.warmCache(recentBookingPersonIds);
 * ```
 */
