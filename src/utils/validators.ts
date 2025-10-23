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

/**
 * Validate URL format
 */
export function isValidURL(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validate URL and return error message if invalid
 */
export function validateURL(value: string): string | null {
    if (!value || value.trim() === '') {
        return null; // Empty is valid for optional fields
    }
    if (!isValidURL(value)) {
        return 'Bitte geben Sie eine gültige URL ein (z.B. https://example.com)';
    }
    return null;
}

/**
 * Check if value is empty
 */
function isEmptyValue(value: string | number | boolean | string[] | undefined | null): boolean {
    if (value === undefined) return true;
    if (value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
}

/**
 * Validate text field value
 */
function validateTextField(value: string, validation: { minLength?: number; maxLength?: number; pattern?: string } | undefined, fieldName: string): string | null {
    if (validation?.minLength && value.length < validation.minLength) {
        return `${fieldName} muss mindestens ${validation.minLength.toString()} Zeichen lang sein`;
    }
    if (validation?.maxLength && value.length > validation.maxLength) {
        return `${fieldName} darf höchstens ${validation.maxLength.toString()} Zeichen lang sein`;
    }
    if (validation?.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
            return `${fieldName} entspricht nicht dem erforderlichen Format`;
        }
    }
    return null;
}

/**
 * Validate number field value
 */
function validateNumberField(value: number, validation: { min?: number; max?: number } | undefined, fieldName: string): string | null {
    if (isNaN(value)) {
        return `${fieldName} muss eine Zahl sein`;
    }
    if (validation?.min !== undefined && value < validation.min) {
        return `${fieldName} muss mindestens ${validation.min.toString()} sein`;
    }
    if (validation?.max !== undefined && value > validation.max) {
        return `${fieldName} darf höchstens ${validation.max.toString()} sein`;
    }
    return null;
}

/**
 * Validate multi-select field value
 */
function validateMultiSelectField(value: string[], options: string[] | undefined, fieldName: string): string | null {
    if (!Array.isArray(value)) {
        return `${fieldName} muss ein Array sein`;
    }
    if (options) {
        const invalidOptions = value.filter(v => !options.includes(v));
        if (invalidOptions.length > 0) {
            return `${fieldName} enthält ungültige Optionen: ${invalidOptions.join(', ')}`;
        }
    }
    return null;
}

/**
 * Validate field value by type
 */
function validateByFieldType(
    type: string,
    value: string | number | boolean | string[],
    field: { validation?: { min?: number; max?: number; pattern?: string; minLength?: number; maxLength?: number }; options?: string[] },
    fieldName: string
): string | null {
    switch (type) {
        case 'text':
        case 'long-text':
            return validateTextField(String(value), field.validation, fieldName);
        case 'number':
            return validateNumberField(Number(value), field.validation, fieldName);
        case 'url':
            return validateURL(String(value));
        case 'select':
            if (field.options && !field.options.includes(String(value))) {
                return `${fieldName} muss einer der verfügbaren Optionen sein`;
            }
            return null;
        case 'multi-select':
            return validateMultiSelectField(value as string[], field.options, fieldName);
        case 'date': {
            const dateValue = new Date(String(value));
            if (isNaN(dateValue.getTime())) {
                return `${fieldName} muss ein gültiges Datum sein`;
            }
            return null;
        }
        case 'checkbox':
            if (typeof value !== 'boolean') {
                return `${fieldName} muss true oder false sein`;
            }
            return null;
        case 'person-reference':
            if (typeof value !== 'string' || value.trim() === '') {
                return `${fieldName} muss eine gültige Person-Referenz sein`;
            }
            return null;
        default:
            return null;
    }
}

/**
 * Validate custom field value based on field definition
 */
export function validateCustomFieldValue(
    value: string | number | boolean | string[] | undefined,
    field: {
        type: string;
        required: boolean;
        validation?: {
            min?: number;
            max?: number;
            pattern?: string;
            minLength?: number;
            maxLength?: number;
        };
        options?: string[];
    },
    fieldName: string
): string | null {
    // Check required
    if (field.required && isEmptyValue(value)) {
        return `${fieldName} ist erforderlich`;
    }

    // If value is empty and not required, it's valid
    if (isEmptyValue(value)) {
        return null;
    }

    // Type-specific validation
    return validateByFieldType(field.type, value as string | number | boolean | string[], field, fieldName);
}
