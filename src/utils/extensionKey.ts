/**
 * Utilities for computing the ChurchTools extension key across environments.
 */

const DEFAULT_BASE_KEY = 'fkoinventorymanagement';

function sanitizeBaseKey(value: string | undefined): string {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return DEFAULT_BASE_KEY;
    const stripped = trimmed.replace(/^(dev|prod|test)/i, '');
    return stripped ? stripped.toLowerCase() : DEFAULT_BASE_KEY;
}

export function getBaseKey(): string {
    return sanitizeBaseKey(import.meta.env['VITE_BASE_KEY']);
}

function normalizeFlag(value: string | undefined): string {
    return (value ?? '').trim().toLowerCase();
}

export function isDevModeEnabled(): boolean {
    return normalizeFlag(import.meta.env['VITE_DEV_MODE']) === 'true';
}

export function getExtensionKey(): string {
    const baseKey = getBaseKey();
    return isDevModeEnabled() ? `dev${baseKey}` : baseKey;
}

export function getSanitizedBaseKey(): string {
    return getBaseKey();
}

export function resolveModuleKey(): string {
    const baseKey = getSanitizedBaseKey();
    const isTest = import.meta.env['VITEST'] === 'true' || import.meta.env.MODE === 'test';

    if (isTest) {
        return `test${baseKey}`;
    }

    const environment = normalizeFlag(import.meta.env['VITE_ENVIRONMENT']) || 'development';

    if (environment === 'production') {
        return `prod${baseKey}`;
    }

    return `dev${baseKey}`;
}

export function getDevModeFlag(): 'true' | 'false' {
    return isDevModeEnabled() ? 'true' : 'false';
}
