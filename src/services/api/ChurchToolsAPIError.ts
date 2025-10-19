/**
 * Custom error class for ChurchTools API errors
 * Provides structured error information with HTTP status codes
 */
export class ChurchToolsAPIError extends Error {
    public readonly statusCode: number;
    public readonly statusText: string;
    public readonly details?: unknown;

    constructor(
        statusCode: number,
        statusText: string,
        message?: string,
        details?: unknown
    ) {
        super(message || `ChurchTools API Error: ${statusCode.toString()} ${statusText}`);
        this.name = 'ChurchToolsAPIError';
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.details = details;
        
        // Maintains proper stack trace for where error was thrown (V8 only)
        Error.captureStackTrace(this, ChurchToolsAPIError);
    }

    /**
     * Check if error is a specific HTTP status code
     */
    is(statusCode: number): boolean {
        return this.statusCode === statusCode;
    }

    /**
     * Check if error is a client error (4xx)
     */
    isClientError(): boolean {
        return this.statusCode >= 400 && this.statusCode < 500;
    }

    /**
     * Check if error is a server error (5xx)
     */
    isServerError(): boolean {
        return this.statusCode >= 500 && this.statusCode < 600;
    }

    /**
     * Convert to JSON for logging/debugging
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            statusText: this.statusText,
            details: this.details,
        };
    }
}
