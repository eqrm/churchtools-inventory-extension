/**
 * Masterdata Searcher Component
 * Provides search with create-on-the-fly option for manufacturers, locations, and models
 */

import { createEl } from '../utils';
import type { MasterdataItem } from '../types';

export interface MasterdataSearcher {
    wrapper: HTMLDivElement;
    input: HTMLInputElement;
    getValue: () => string;
    setValue: (value: string) => void;
}

export type MasterdataType = 'manufacturers' | 'locations' | 'models';

/**
 * Create a masterdata searcher component
 * @param type - Type of masterdata (manufacturers, locations, models)
 * @param items - Array of masterdata items
 * @param initialValue - Pre-selected value
 * @param onCreate - Callback when creating a new item
 */
export function createMasterdataSearcher(
    type: MasterdataType,
    items: MasterdataItem[],
    initialValue?: string,
    onCreate?: (name: string) => Promise<void>
): MasterdataSearcher {
    const typeLabel = type === 'manufacturers' ? 'manufacturer' : 
                      type === 'locations' ? 'location' : 'model';
    
    const wrapper = createEl('div', { class: 'searchable-dropdown' });
    const input = createEl('input', { 
        type: 'text', 
        placeholder: `Search or create ${typeLabel}...`,
        value: initialValue ?? ''
    }) as HTMLInputElement;
    const dropdown = createEl('div', { class: 'dropdown-list' });
    
    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    let isOpen = false;
    let searchTimeout: number | undefined;

    function filterItems(query: string) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (!normalizedQuery) {
            return items.slice(0, 20); // Show first 20 items when no query
        }
        
        return items.filter(item => 
            item.name.toLowerCase().includes(normalizedQuery)
        ).slice(0, 20);
    }

    function renderDropdown(query: string) {
        const filtered = filterItems(query);
        dropdown.innerHTML = '';
        
        // Show filtered results
        if (filtered.length > 0) {
            filtered.forEach(item => {
                const dropdownItem = createEl('div', { class: 'dropdown-item' });
                dropdownItem.textContent = item.name;
                
                dropdownItem.addEventListener('click', () => {
                    input.value = item.name;
                    closeDropdown();
                });
                dropdown.appendChild(dropdownItem);
            });
        }
        
        // Show "Create new" option if query doesn't exactly match any item
        const exactMatch = items.some(item => 
            item.name.toLowerCase() === query.toLowerCase().trim()
        );
        
        if (query.trim() && !exactMatch && onCreate) {
            const createItem = createEl('div', { 
                class: 'dropdown-item',
                style: 'background:#e3f2fd;font-weight:500;border-top:1px solid #ddd'
            });
            createItem.textContent = `+ Create "${query.trim()}"`;
            
            createItem.addEventListener('click', async () => {
                const newName = query.trim();
                try {
                    await onCreate(newName);
                    input.value = newName;
                    closeDropdown();
                } catch (error) {
                    console.error('Error creating masterdata item:', error);
                    alert('Failed to create item: ' + (error instanceof Error ? error.message : String(error)));
                }
            });
            dropdown.appendChild(createItem);
        }
        
        // Show empty state if no results and no query
        if (filtered.length === 0 && !query.trim()) {
            const empty = createEl('div', { class: 'dropdown-item' }, `(No ${type} yet)`);
            empty.style.fontStyle = 'italic';
            empty.style.color = '#999';
            dropdown.appendChild(empty);
        }
    }

    function openDropdown() {
        isOpen = true;
        dropdown.style.display = 'block';
        renderDropdown(input.value);
    }

    function closeDropdown() {
        isOpen = false;
        dropdown.style.display = 'none';
    }

    input.addEventListener('focus', () => {
        openDropdown();
    });
    
    input.addEventListener('input', () => {
        if (!isOpen) openDropdown();
        
        // Debounce the search
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = window.setTimeout(() => {
            renderDropdown(input.value);
        }, 200);
    });

    // Close on click outside
    const clickOutsideHandler = (e: MouseEvent) => {
        if (!wrapper.contains(e.target as Node)) {
            closeDropdown();
        }
    };
    document.addEventListener('click', clickOutsideHandler);

    return { 
        wrapper, 
        input,
        getValue: () => input.value.trim(),
        setValue: (value: string) => {
            input.value = value;
        }
    };
}
