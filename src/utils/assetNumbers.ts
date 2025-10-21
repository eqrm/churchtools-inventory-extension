/**
 * Asset numbering utilities
 * Supports both legacy global prefix and new multi-prefix system (E5)
 */

/**
 * Pad asset number with leading zeros to 3 digits (for prefix-based) or 5 digits (legacy)
 */
export function padAssetNumber(num: number, digits: number = 5): string {
    return num.toString().padStart(digits, '0');
}

/**
 * Parse asset number (remove leading zeros and prefix)
 */
export function parseAssetNumber(assetNumber: string, prefix?: string): number {
    // If prefix provided, remove it first
    const numberPart = prefix ? assetNumber.replace(`${prefix}-`, '') : assetNumber;
    return parseInt(numberPart, 10);
}

/**
 * Generate next asset number from existing numbers
 * T273: Now supports prefix-specific sequences
 * 
 * @param existingNumbers - Array of existing asset numbers
 * @param prefix - Optional prefix to filter by and format with
 * @param useShortFormat - If true, uses 3-digit padding (for prefixes), otherwise 5-digit (legacy)
 */
export function generateNextAssetNumber(
    existingNumbers: string[],
    prefix?: string,
    useShortFormat: boolean = false
): string {
    const digits = useShortFormat ? 3 : 5;
    
    // Filter to only numbers with matching prefix if provided
    let relevantNumbers = existingNumbers;
    if (prefix) {
        relevantNumbers = existingNumbers
            .filter(num => num.startsWith(`${prefix}-`))
            .map(num => num.replace(`${prefix}-`, ''));
    }
    
    if (relevantNumbers.length === 0) {
        const paddedNumber = padAssetNumber(1, digits);
        return prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
    }
    
    const numbers = relevantNumbers
        .map(num => parseAssetNumber(num))
        .filter(num => !isNaN(num));
    
    if (numbers.length === 0) {
        const paddedNumber = padAssetNumber(1, digits);
        return prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
    }
    
    const max = Math.max(...numbers);
    const paddedNumber = padAssetNumber(max + 1, digits);
    return prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
}

/**
 * Check if asset number is already in use
 */
export function isAssetNumberInUse(assetNumber: string, existingNumbers: string[]): boolean {
    return existingNumbers.includes(assetNumber);
}

/**
 * Suggest available asset numbers
 * T273: Supports prefix-based numbering
 */
export function suggestAssetNumbers(
    existingNumbers: string[],
    count: number = 5,
    prefix?: string,
    useShortFormat: boolean = false
): string[] {
    const suggestions: string[] = [];
    const nextNumStr = generateNextAssetNumber(existingNumbers, prefix, useShortFormat);
    
    // Extract numeric part
    let nextNumber: number;
    if (prefix) {
        nextNumber = parseAssetNumber(nextNumStr, prefix);
    } else {
        nextNumber = parseAssetNumber(nextNumStr);
    }
    
    const digits = useShortFormat ? 3 : 5;
    
    for (let i = 0; i < count; i++) {
        const paddedNumber = padAssetNumber(nextNumber, digits);
        const fullNumber = prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
        
        if (!isAssetNumberInUse(fullNumber, existingNumbers)) {
            suggestions.push(fullNumber);
        }
        nextNumber++;
    }
    
    return suggestions;
}
