/**
 * Asset numbering utilities
 */

/**
 * Pad asset number with leading zeros to 5 digits
 */
export function padAssetNumber(num: number): string {
    return num.toString().padStart(5, '0');
}

/**
 * Parse asset number (remove leading zeros)
 */
export function parseAssetNumber(assetNumber: string): number {
    return parseInt(assetNumber, 10);
}

/**
 * Generate next asset number from existing numbers
 */
export function generateNextAssetNumber(existingNumbers: string[]): string {
    if (existingNumbers.length === 0) {
        return padAssetNumber(1);
    }
    
    const numbers = existingNumbers
        .map(parseAssetNumber)
        .filter(num => !isNaN(num));
    
    if (numbers.length === 0) {
        return padAssetNumber(1);
    }
    
    const max = Math.max(...numbers);
    return padAssetNumber(max + 1);
}

/**
 * Check if asset number is already in use
 */
export function isAssetNumberInUse(assetNumber: string, existingNumbers: string[]): boolean {
    return existingNumbers.includes(assetNumber);
}

/**
 * Suggest available asset numbers
 */
export function suggestAssetNumbers(existingNumbers: string[], count: number = 5): string[] {
    const suggestions: string[] = [];
    let nextNumber = parseAssetNumber(generateNextAssetNumber(existingNumbers));
    
    for (let i = 0; i < count; i++) {
        const padded = padAssetNumber(nextNumber);
        if (!isAssetNumberInUse(padded, existingNumbers)) {
            suggestions.push(padded);
        }
        nextNumber++;
    }
    
    return suggestions;
}
