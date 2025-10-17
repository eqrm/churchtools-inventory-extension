/**
 * Searchable Dropdown Component
 * Provides a text input with a filterable dropdown list
 */

import { createEl } from '../utils';

export interface SearchableDropdown {
    wrapper: HTMLDivElement;
    input: HTMLInputElement;
    getValue: () => string;
}

/**
 * Create a searchable dropdown component
 * @param options - List of options to display
 * @param initialValue - Initial selected value
 * @param placeholder - Placeholder text for the input
 */
export function createSearchableDropdown(
    options: string[],
    initialValue?: string,
    placeholder = 'Select or type...'
): SearchableDropdown {
    const wrapper = createEl('div', { class: 'searchable-dropdown' });
    const input = createEl('input', { 
        type: 'text', 
        placeholder,
        value: initialValue ?? ''
    }) as HTMLInputElement;
    const dropdown = createEl('div', { class: 'dropdown-list' });
    
    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    let isOpen = false;

    function updateDropdown(filter = '') {
        dropdown.innerHTML = '';
        const filtered = filter 
            ? options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()))
            : options;
        
        if (filtered.length === 0) {
            const empty = createEl('div', { class: 'dropdown-item' }, '(No matches)');
            empty.style.fontStyle = 'italic';
            empty.style.color = '#999';
            dropdown.appendChild(empty);
            return;
        }

        filtered.forEach(opt => {
            const item = createEl('div', { class: 'dropdown-item' }, opt);
            item.addEventListener('click', () => {
                input.value = opt;
                closeDropdown();
            });
            dropdown.appendChild(item);
        });
    }

    function openDropdown() {
        isOpen = true;
        dropdown.style.display = 'block';
        updateDropdown(input.value);
    }

    function closeDropdown() {
        isOpen = false;
        dropdown.style.display = 'none';
    }

    input.addEventListener('focus', () => openDropdown());
    input.addEventListener('input', () => {
        if (!isOpen) openDropdown();
        updateDropdown(input.value);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target as Node)) {
            closeDropdown();
        }
    });

    return { wrapper, input, getValue: () => input.value.trim() };
}
