/**
 * Environment Variable Validation
 * 
 * Validates that all required environment variables are set before app initialization.
 * Provides helpful error messages if configuration is incomplete.
 */

import { getBaseKey, getDevModeFlag, getExtensionKey } from './extensionKey';

interface RequiredEnvVars {
  VITE_BASE_URL: string;
  VITE_USERNAME: string;
  VITE_PASSWORD: string;
}

interface OptionalEnvVars {
  VITE_MODULE_ID?: string;
  VITE_ENVIRONMENT?: string;
}

interface DerivedEnvVars {
  VITE_BASE_KEY: string;
  VITE_KEY: string;
  VITE_DEV_MODE: 'true' | 'false';
}

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
 
export function validateEnvironment(): RequiredEnvVars & OptionalEnvVars & DerivedEnvVars {
  const missing: string[] = [];
  
  // Check required variables
  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const VITE_USERNAME = import.meta.env.VITE_USERNAME;
  const VITE_PASSWORD = import.meta.env.VITE_PASSWORD;
  
  // Collect missing variables
  if (!VITE_BASE_URL) missing.push('VITE_BASE_URL');
  if (!VITE_USERNAME) missing.push('VITE_USERNAME');
  if (!VITE_PASSWORD) missing.push('VITE_PASSWORD');
  
  // Throw if any required variables are missing
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n\n` +
      missing.map(key => `  - ${key}`).join('\n') +
      `\n\nPlease create a .env file based on .env.example and configure all required variables.\n` +
      `See docs/quickstart.md for setup instructions.`
    );
  }
  
  // At this point TypeScript knows these are strings (not undefined)
  // Validate URL format
  try {
    new URL(VITE_BASE_URL);
  } catch {
    throw new Error(
      `Invalid VITE_BASE_URL: "${VITE_BASE_URL}"\n\n` +
      `VITE_BASE_URL must be a valid URL (e.g., https://your-church.church.tools)`
    );
  }
  
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  if (!['development', 'production'].includes(environment)) {
    console.warn(
      `[Config] Invalid VITE_ENVIRONMENT: "${environment}" - using "development".\n` +
      'Valid values: "development" or "production"'
    );
  }
  
  // Type guard: we've verified these are strings above
  if (typeof VITE_BASE_URL !== 'string' || 
      typeof VITE_USERNAME !== 'string' ||
      typeof VITE_PASSWORD !== 'string') {
    throw new Error('Environment validation failed unexpectedly');
  }

  const VITE_BASE_KEY = getBaseKey();
  const VITE_KEY = getExtensionKey();
  const VITE_DEV_MODE = getDevModeFlag();

  const rawDevMode = (import.meta.env['VITE_DEV_MODE'] ?? '').trim();
  if (
    rawDevMode.length > 0 &&
    !['true', 'false'].includes(rawDevMode.toLowerCase())
  ) {
    console.warn(
      `[Config] Invalid VITE_DEV_MODE: "${rawDevMode}" - using "${VITE_DEV_MODE}".`
    );
  }

  const rawBaseKey = (import.meta.env['VITE_BASE_KEY'] ?? '').trim();
  if (rawBaseKey && rawBaseKey !== VITE_BASE_KEY) {
    console.warn(
      `[Config] Sanitized VITE_BASE_KEY from "${rawBaseKey}" to "${VITE_BASE_KEY}".`
    );
  }
  
  return {
    VITE_BASE_URL,
    VITE_USERNAME,
    VITE_PASSWORD,
    VITE_BASE_KEY,
    VITE_KEY,
    VITE_DEV_MODE,
    VITE_MODULE_ID: import.meta.env.VITE_MODULE_ID,
    VITE_ENVIRONMENT: environment,
  };
}

/**
 * Gets the current environment (development or production)
 */
export function getEnvironment(): 'development' | 'production' {
  const env = import.meta.env.VITE_ENVIRONMENT || 'development';
  return env === 'production' ? 'production' : 'development';
}

/**
 * Checks if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Checks if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}
