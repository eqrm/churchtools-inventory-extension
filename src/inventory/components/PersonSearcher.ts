/**
 * Person Searcher Component
 * Provides ChurchTools API-integrated person search with profile images
 */

import { churchtoolsClient } from '@churchtools/churchtools-client';
import { createEl } from '../utils';

export interface PersonSearcher {
    wrapper: HTMLDivElement;
    input: HTMLInputElement;
    getPersonId: () => number | undefined;
    getPersonName: () => string;
}

/**
 * Create a person searcher component with ChurchTools integration
 * @param initialPersonId - Pre-selected person ID
 * @param initialPersonName - Pre-selected person name
 */
export function createPersonSearcher(
    initialPersonId?: number,
    initialPersonName?: string
): PersonSearcher {
    const wrapper = createEl('div', { class: 'searchable-dropdown' });
    const input = createEl('input', { 
        type: 'text', 
        placeholder: 'Search for a person...',
        value: initialPersonName ?? ''
    }) as HTMLInputElement;
    const dropdown = createEl('div', { class: 'dropdown-list' });
    
    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    let isOpen = false;
    let selectedPersonId: number | undefined = initialPersonId;
    let searchTimeout: number | undefined;

    async function searchPeople(query: string) {
        if (!query || query.length < 2) {
            dropdown.innerHTML = '';
            const hint = createEl('div', { class: 'dropdown-item' }, 'Type at least 2 characters...');
            hint.style.fontStyle = 'italic';
            hint.style.color = '#999';
            dropdown.appendChild(hint);
            return;
        }

        try {
            // ChurchTools search endpoint uses GET with query parameters
            const searchParams = new URLSearchParams();
            searchParams.append('query', query);
            searchParams.append('domain_types[]', 'person');
            searchParams.append('limit', '20');
            
            const response: any = await churchtoolsClient.get(`/search?${searchParams.toString()}`);
            
            // The response is the array directly, not wrapped in a data property
            const results = Array.isArray(response) ? response : (response?.data || []);
            dropdown.innerHTML = '';
            
            if (results.length === 0) {
                const empty = createEl('div', { class: 'dropdown-item' }, '(No people found)');
                empty.style.fontStyle = 'italic';
                empty.style.color = '#999';
                dropdown.appendChild(empty);
                return;
            }

            results.forEach((result: any) => {
                if (result.domainType !== 'person') return;
                
                const personId = parseInt(result.domainIdentifier, 10);
                const item = createEl('div', { class: 'dropdown-item' });
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '8px';
                
                // Add profile image if available
                if (result.imageUrl) {
                    const img = createEl('img', { 
                        src: result.imageUrl,
                        alt: result.title,
                        style: 'width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0'
                    }) as HTMLImageElement;
                    item.appendChild(img);
                } else {
                    // Show initials as fallback
                    const initials = result.initials || result.title.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    const initialsCircle = createEl('div', { 
                        style: 'width:24px;height:24px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#6b7280;flex-shrink:0'
                    }, initials);
                    item.appendChild(initialsCircle);
                }
                
                const nameSpan = createEl('span', {}, result.title);
                item.appendChild(nameSpan);
                
                item.addEventListener('click', () => {
                    input.value = result.title;
                    selectedPersonId = personId;
                    closeDropdown();
                });
                dropdown.appendChild(item);
            });
        } catch (error) {
            console.error('Error searching people:', error);
            dropdown.innerHTML = '';
            const errorMsg = error instanceof Error ? error.message : 'Error loading people';
            const errorItem = createEl('div', { class: 'dropdown-item' }, errorMsg);
            errorItem.style.color = '#f00';
            errorItem.style.fontSize = '11px';
            dropdown.appendChild(errorItem);
        }
    }

    function openDropdown() {
        isOpen = true;
        dropdown.style.display = 'block';
    }

    function closeDropdown() {
        isOpen = false;
        dropdown.style.display = 'none';
    }

    input.addEventListener('focus', () => {
        openDropdown();
        if (input.value.length >= 2) {
            searchPeople(input.value);
        }
    });
    
    input.addEventListener('input', () => {
        if (!isOpen) openDropdown();
        
        // Clear selection when user types
        if (input.value !== initialPersonName) {
            selectedPersonId = undefined;
        }
        
        // Debounce the search
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = window.setTimeout(() => {
            searchPeople(input.value);
        }, 300);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target as Node)) {
            closeDropdown();
        }
    });

    return { 
        wrapper, 
        input, 
        getPersonId: () => selectedPersonId,
        getPersonName: () => input.value.trim()
    };
}
