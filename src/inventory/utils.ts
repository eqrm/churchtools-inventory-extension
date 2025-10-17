/**
 * Utility functions for the inventory system
 */

/**
 * Generate a unique ID
 */
export function genId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Format date to ISO string
 */
export function fmtDate(d = new Date()): string {
    return d.toISOString();
}

/**
 * Create a DOM element with attributes and optional text content
 */
export function createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: Record<string, string> = {},
    text?: string
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
}
