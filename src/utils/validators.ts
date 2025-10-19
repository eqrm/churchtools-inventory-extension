/**
 * Validation utilities for forms and data
 */

/**
 * Validate asset number format (1-5 digits)
 */
export function isValidAssetNumber(value: string): boolean {
    return /^\d{1,5}$/.test(value);
}

/**
 * Validate asset number and return error message if invalid
 */
export function validateAssetNumber(value: string): string | null {
    if (!value || value.trim() === '') {
        return 'Asset-Nummer ist erforderlich';
    }
    if (!isValidAssetNumber(value)) {
        return 'Asset-Nummer muss 1-5 Ziffern enthalten';
    }
    return null;
}

/**
 * Validate barcode format (Code-128: printable ASCII)
 */
export function isValidBarcode(value: string): boolean {
    // Code-128 can encode printable ASCII 32-126
    return /^[ -~]+$/.test(value) && value.length > 0;
}

/**
 * Validate QR code format (alphanumeric, up to 4,296 characters)
 */
export function isValidQRCode(value: string): boolean {
    return value.length > 0 && value.length <= 4296;
}

/**
 * Validate email format
 */
export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validate date is not in the past
 */
export function isDateInFuture(date: Date): boolean {
    return date.getTime() > Date.now();
}

/**
 * Validate date range (start before end)
 */
export function isValidDateRange(start: Date, end: Date): boolean {
    return start.getTime() < end.getTime();
}

/**
 * Validate required field
 */
export function validateRequired(value: string | null | undefined, fieldName: string): string | null {
    if (!value || value.trim() === '') {
        return `${fieldName} ist erforderlich`;
    }
    return null;
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
    if (value.length < minLength) {
        return `${fieldName} muss mindestens ${minLength.toString()} Zeichen lang sein`;
    }
    return null;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
    if (value.length > maxLength) {
        return `${fieldName} darf höchstens ${maxLength.toString()} Zeichen lang sein`;
    }
    return null;
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number, fieldName: string): string | null {
    if (value <= 0) {
        return `${fieldName} muss eine positive Zahl sein`;
    }
    return null;
}

/**
 * Validate non-negative number
 */
export function validateNonNegativeNumber(value: number, fieldName: string): string | null {
    if (value < 0) {
        return `${fieldName} darf nicht negativ sein`;
    }
    return null;
}
