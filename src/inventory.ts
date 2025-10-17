// Lightweight inventory management UI and persistence for the extension boilerplate.
// Stores items in localStorage under key 'ct-inventory-items'.

// Import styles via Vite
import './inventory.css';
import { churchtoolsClient } from '@churchtools/churchtools-client';

export type InventoryItem = {
    // internal stable id (never changes)
    id: string;
    // human visible asset id with prefix (optional)
    assetId?: string;
    assetIcon?: string; // Data URL for asset icon image
    name: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    quantity: number;
    location?: string;
    status?: string;
    assignedToPersonId?: number;
    assignedToPersonName?: string;
    notes?: string;
    tags?: string[];
    createdBy?: string;
    createdAt?: string;
    updatedBy?: string;
    updatedAt: string;
    history?: HistoryEntry[];
};

export type HistoryEntry = {
    timestamp: string;
    user: string;
    action: string;
    changes?: { field: string; oldValue?: string; newValue?: string }[];
};

export type Kit = {
    id: string;
    name: string;
    itemIds: string[];
    notes?: string;
    updatedAt: string;
};

export type Booking = {
    id: string;
    title: string;
    start: string; // ISO
    end: string; // ISO
    itemIds: string[]; // items or kit-expanded items
    createdAt: string;
};

const STORAGE_KEY = 'ct-inventory-items';
const KITS_KEY = 'ct-inventory-kits';
const BOOKINGS_KEY = 'ct-inventory-bookings';
const PREFIX_COUNTERS_KEY = 'ct-inventory-prefix-counters';
const SETTINGS_KEY = 'ct-inventory-settings';

type PrefixCounters = Record<string, number>;

export type InventorySettings = {
    locations: string[];
    assetPrefixes: string[];
    statuses: string[];
};

// Fixed status options - not configurable in settings
const FIXED_STATUSES = [
    'Available',
    'Broken',
    'In Repair',
    'Sold',
    'Scrapped',
    'Assigned to Person',
    'Installed'
] as const;

function loadSettings(): InventorySettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { locations: [], assetPrefixes: [], statuses: [] };
        const parsed = JSON.parse(raw) as InventorySettings;
        return parsed;
    } catch (e) {
        console.error('Failed to load settings', e);
        return { locations: [], assetPrefixes: [], statuses: [] };
    }
}

function saveSettings(settings: InventorySettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadPrefixCounters(): PrefixCounters {
    try {
        const raw = localStorage.getItem(PREFIX_COUNTERS_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as PrefixCounters;
    } catch (e) {
        console.error('Failed to load prefix counters', e);
        return {};
    }
}

function savePrefixCounters(c: PrefixCounters) {
    localStorage.setItem(PREFIX_COUNTERS_KEY, JSON.stringify(c));
}

function ensurePrefixCountersFromItems(items: InventoryItem[], counters: PrefixCounters) {
    for (const it of items) {
        if (!it.assetId) continue;
        const parts = it.assetId.split('-');
        if (parts.length < 2) continue;
        const prefix = parts.slice(0, parts.length - 1).join('-');
        const numStr = parts[parts.length - 1];
        const num = parseInt(numStr, 10);
        if (Number.isFinite(num)) {
            counters[prefix] = Math.max(counters[prefix] ?? 0, num);
        }
    }
}

function nextAssetId(prefix: string, items: InventoryItem[], counters: PrefixCounters) {
    // Normalize prefix to upper-case, remove whitespace
    const p = (prefix || '').trim();
    if (!p) throw new Error('Prefix required');
    // ensure counters reflect items
    ensurePrefixCountersFromItems(items, counters);
    let counter = counters[p] ?? 0;
    counter = Math.max(counter, 0) + 1;
    counters[p] = counter;
    savePrefixCounters(counters);
    const num = String(counter).padStart(5, '0');
    return `${p}-${num}`;
}

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadItems(): InventoryItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as InventoryItem[];
        return parsed;
    } catch (e) {
        console.error('Failed to load inventory items', e);
        return [];
    }
}

function saveItems(items: InventoryItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadKits(): Kit[] {
    try {
        const raw = localStorage.getItem(KITS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Kit[];
    } catch (e) {
        console.error('Failed to load kits', e);
        return [];
    }
}

function saveKits(kits: Kit[]) {
    localStorage.setItem(KITS_KEY, JSON.stringify(kits));
}

function loadBookings(): Booking[] {
    try {
        const raw = localStorage.getItem(BOOKINGS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Booking[];
    } catch (e) {
        console.error('Failed to load bookings', e);
        return [];
    }
}

function saveBookings(bookings: Booking[]) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

function fmtDate(d = new Date()) {
    return d.toISOString();
}

function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
}

// Searchable dropdown component
function createSearchableDropdown(options: string[], initialValue?: string, placeholder = 'Select or type...') {
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

// Create a person searcher that fetches from ChurchTools API
function createPersonSearcher(initialPersonId?: number, initialPersonName?: string) {
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
            // Build URL manually to ensure correct format
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
            console.error('Error searching people:', error, JSON.stringify(error));
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


type InitOptions = {
    syncHandler?: (items: InventoryItem[]) => Promise<void>;
    currentUser?: { firstName: string; lastName: string };
};

export function initInventory(container: HTMLElement, options?: InitOptions) {
    container.innerHTML = '';
    // root class for styling
    container.classList.add('ct-inventory-root');

    const currentUserName = options?.currentUser ? `${options.currentUser.firstName} ${options.currentUser.lastName}` : 'Unknown User';

    // Header & tab navigation
    const header = createEl('div', { style: 'display:flex;gap:12px;align-items:center;margin:12px 0' });
    header.appendChild(createEl('h1', {}, '📦 Inventory Manager'));

    const tabs = createEl('div', { style: 'margin-left:12px' });
    const tabInventory = createEl('button', { type: 'button' }, 'Inventory');
    const tabKits = createEl('button', { type: 'button' }, 'Kits');
    const tabBookings = createEl('button', { type: 'button' }, 'Bookings');
    [tabInventory, tabKits, tabBookings].forEach(t => { t.style.marginLeft = '6px'; tabs.appendChild(t); });
    header.appendChild(tabs);

    // Global controls
    const settingsBtn = createEl('button', { type: 'button' }, '⚙️ Settings');
    const importBtn = createEl('button', { type: 'button' }, 'Import JSON');
    const exportBtn = createEl('button', { type: 'button' }, 'Export JSON');
    const clearBtn = createEl('button', { type: 'button' }, 'Clear all');
    const syncBtn = createEl('button', { type: 'button' }, 'Sync (optional)');
    [settingsBtn, importBtn, exportBtn, clearBtn, syncBtn].forEach(b => { b.style.marginLeft = '6px'; header.appendChild(b); });

    container.appendChild(header);

    const content = createEl('div');
    container.appendChild(content);

    // Inventory section
    const invSection = createEl('div');
    // Toolbar with New Asset button and search
    const toolbar = createEl('div', { style: 'display:flex;gap:8px;align-items:center;margin:8px 0' });
    const newAssetBtn = createEl('button', { type: 'button' }, '➕ New Asset');
    const searchInput = createEl('input', { placeholder: 'Search name, tag or asset id', style: 'margin-left:8px;padding:6px;border:1px solid var(--ct-border);border-radius:6px' }) as HTMLInputElement;
    toolbar.appendChild(newAssetBtn);
    toolbar.appendChild(searchInput);

    // QR Scan area
    const scanArea = createEl('div', { style: 'display:flex;gap:8px;align-items:center;margin:8px 0' });
    const cameraBtn = createEl('button', { type: 'button' }, 'Scan from camera');
    const imageBtn = createEl('button', { type: 'button' }, 'Scan from image');
    const manualCode = createEl('input', { placeholder: 'Or paste code here' }) as HTMLInputElement;
    const manualBtn = createEl('button', { type: 'button' }, 'Use code');
    scanArea.appendChild(cameraBtn);
    scanArea.appendChild(imageBtn);
    scanArea.appendChild(manualCode);
    scanArea.appendChild(manualBtn);

    const videoEl = createEl('video', { autoplay: 'true', playsinline: 'true', style: 'display:none;max-width:320px;border:1px solid #ddd' }) as HTMLVideoElement;
    const canvasEl = createEl('canvas', { style: 'display:none' }) as HTMLCanvasElement;

    const table = createEl('table', { border: '1', style: 'width:100%;border-collapse:collapse;margin-top:8px' });
    const thead = createEl('thead');
    const headRow = createEl('tr');
    ['Name', 'Manufacturer', 'Model', 'Serial Number', 'Quantity', 'Location', 'Status', 'Assigned To', 'Tags', 'Notes', 'Updated', 'Actions'].forEach(h => {
        const th = createEl('th', { style: 'padding:6px;background:#f3f3f3;text-align:left' }, h);
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = createEl('tbody');
    table.appendChild(tbody);

    invSection.appendChild(toolbar);
    invSection.appendChild(scanArea);
    invSection.appendChild(videoEl);
    invSection.appendChild(canvasEl);
    invSection.appendChild(table);

    // Kits section
    const kitsSection = createEl('div', { style: 'display:none' });
    const kitsForm = createEl('form', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0' }) as HTMLFormElement;
    const kitName = createEl('input', { placeholder: 'Kit name', required: 'true', style: 'min-width:160px' }) as HTMLInputElement;
    const kitItemsSelect = createEl('select', { multiple: 'true', size: '6', style: 'min-width:320px' }) as HTMLSelectElement;
    const kitNotes = createEl('input', { placeholder: 'Notes', style: 'min-width:200px' }) as HTMLInputElement;
    const kitAddBtn = createEl('button', { type: 'submit' }, 'Create / Update Kit');
    kitsForm.appendChild(kitName);
    kitsForm.appendChild(kitItemsSelect);
    kitsForm.appendChild(kitNotes);
    kitsForm.appendChild(kitAddBtn);

    const kitsList = createEl('div');
    kitsSection.appendChild(kitsForm);
    kitsSection.appendChild(kitsList);

    // Bookings section
    const bookingsSection = createEl('div', { style: 'display:none' });
    const bookingsForm = createEl('form', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0' }) as HTMLFormElement;
    const bookingTitle = createEl('input', { placeholder: 'Booking title', required: 'true', style: 'min-width:160px' }) as HTMLInputElement;
    const bookingStart = createEl('input', { type: 'datetime-local', required: 'true' }) as HTMLInputElement;
    const bookingEnd = createEl('input', { type: 'datetime-local', required: 'true' }) as HTMLInputElement;
    const bookingItemsSelect = createEl('select', { multiple: 'true', size: '6', style: 'min-width:320px' }) as HTMLSelectElement;
    const bookingAddBtn = createEl('button', { type: 'submit' }, 'Create Booking');
    bookingsForm.appendChild(bookingTitle);
    bookingsForm.appendChild(bookingStart);
    bookingsForm.appendChild(bookingEnd);
    bookingsForm.appendChild(bookingItemsSelect);
    bookingsForm.appendChild(bookingAddBtn);

    const bookingsList = createEl('div');
    bookingsSection.appendChild(bookingsForm);
    bookingsSection.appendChild(bookingsList);

    content.appendChild(invSection);
    content.appendChild(kitsSection);
    content.appendChild(bookingsSection);

    // state
    let items = loadItems();
    let kits = loadKits();
    let bookings = loadBookings();
    let prefixCounters = loadPrefixCounters();
    let settings = loadSettings();

    // Helper to create assigned person cell with icon
    async function createAssignedPersonCell(item: InventoryItem) {
        const cell = createEl('td', { style: 'padding:6px;border-top:1px solid #eee' });
        
        if (!item.assignedToPersonId || !item.assignedToPersonName) {
            return cell;
        }
        
        const wrapper = createEl('div', { style: 'display:flex;align-items:center;gap:6px' });
        
        // Try to fetch person image from API
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('query', item.assignedToPersonName);
            searchParams.append('domain_types[]', 'person');
            searchParams.append('limit', '1');
            
            const response: any = await churchtoolsClient.get(`/search?${searchParams.toString()}`);
            const results = Array.isArray(response) ? response : (response?.data || []);
            const person = results.find((r: any) => r.domainType === 'person' && parseInt(r.domainIdentifier, 10) === item.assignedToPersonId);
            
            if (person?.imageUrl) {
                const img = createEl('img', { 
                    src: person.imageUrl,
                    alt: item.assignedToPersonName,
                    style: 'width:20px;height:20px;border-radius:50%;object-fit:cover;flex-shrink:0'
                }) as HTMLImageElement;
                wrapper.appendChild(img);
            } else {
                // Show initials as fallback
                const initials = item.assignedToPersonName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const initialsCircle = createEl('div', { 
                    style: 'width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#6b7280;flex-shrink:0'
                }, initials);
                wrapper.appendChild(initialsCircle);
            }
        } catch (e) {
            // If fetch fails, show initials
            const initials = item.assignedToPersonName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const initialsCircle = createEl('div', { 
                style: 'width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#6b7280;flex-shrink:0'
            }, initials);
            wrapper.appendChild(initialsCircle);
        }
        
        const nameSpan = createEl('span', {}, item.assignedToPersonName);
        wrapper.appendChild(nameSpan);
        cell.appendChild(wrapper);
        
        return cell;
    }

    function refreshSelects() {
        // kit items select & booking items select
        kitItemsSelect.innerHTML = '';
        bookingItemsSelect.innerHTML = '';
        for (const it of items) {
            const opt = createEl('option', { value: it.id }, `${it.name} (${it.quantity})`);
            kitItemsSelect.appendChild(opt);
            const opt2 = createEl('option', { value: it.id }, `${it.name} (${it.quantity})`);
            bookingItemsSelect.appendChild(opt2);
        }
    }

    async function renderInventory() {
        tbody.innerHTML = '';
        items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        for (const it of items) {
            const tr = createEl('tr');
            tr.style.cursor = 'pointer';
            const td = (txt: string) => createEl('td', { style: 'padding:6px;border-top:1px solid #eee' }, txt);
            tr.appendChild(td(it.name));
            tr.appendChild(td(it.manufacturer ?? ''));
            tr.appendChild(td(it.model ?? ''));
            tr.appendChild(td(it.serialNumber ?? ''));
            tr.appendChild(td(String(it.quantity)));
            tr.appendChild(td(it.location ?? ''));
            tr.appendChild(td(it.status ?? ''));
            
            // Add assigned person with icon
            const assignedCell = await createAssignedPersonCell(it);
            tr.appendChild(assignedCell);
            
            tr.appendChild(td((it.tags ?? []).join(', ')));
            tr.appendChild(td(it.notes ?? ''));
            tr.appendChild(td(new Date(it.updatedAt).toLocaleString()));
            const actions = createEl('td', { style: 'padding:6px;border-top:1px solid #eee' });
            const del = createEl('button', { type: 'button' }, 'Delete');
            del.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click from triggering
                if (!confirm(`Delete "${it.name}"?`)) return;
                items = items.filter(x => x.id !== it.id);
                saveItems(items);
                renderAll();
            });
            actions.appendChild(del);
            tr.appendChild(actions);
            // Make entire row clickable to open modal
            tr.addEventListener('click', () => openAssetModal(it.id));
            tbody.appendChild(tr);
        }
        refreshSelects();
    }

    // Asset detail modal
    const modal = createEl('div', { class: 'ct-asset-modal' });
    const modalBox = createEl('div', { class: 'box' });
    modal.appendChild(modalBox);
    document.body.appendChild(modal);

    // Settings modal
    const settingsModal = createEl('div', { class: 'ct-asset-modal' });
    const settingsBox = createEl('div', { class: 'box' });
    settingsModal.appendChild(settingsBox);
    document.body.appendChild(settingsModal);

    function openSettingsModal() {
        settingsBox.innerHTML = '';
        settingsModal.style.display = 'flex';
        requestAnimationFrame(() => settingsModal.classList.add('open'));

        const xBtn = createEl('button', { type: 'button', class: 'modal-close-btn', 'aria-label': 'Close' }, '✕');
        xBtn.addEventListener('click', () => closeSettingsModal());
        settingsBox.appendChild(xBtn);

        const title = createEl('h2', {}, '⚙️ Settings');
        settingsBox.appendChild(title);

        // Locations section
        const locationsHeader = createEl('h3', {}, 'Locations');
        settingsBox.appendChild(locationsHeader);

        const locationsList = createEl('div', { style: 'margin:8px 0' });
        const renderLocations = () => {
            locationsList.innerHTML = '';
            settings.locations.forEach((loc, idx) => {
                const item = createEl('div', { style: 'display:flex;gap:8px;align-items:center;margin:4px 0' });
                item.appendChild(createEl('span', {}, loc));
                const delBtn = createEl('button', { type: 'button' }, '🗑️');
                delBtn.addEventListener('click', () => {
                    settings.locations.splice(idx, 1);
                    saveSettings(settings);
                    renderLocations();
                });
                item.appendChild(delBtn);
                locationsList.appendChild(item);
            });
        };
        renderLocations();
        settingsBox.appendChild(locationsList);

        const addLocationForm = createEl('form', { style: 'display:flex;gap:8px;margin:8px 0' }) as HTMLFormElement;
        const newLocationInput = createEl('input', { placeholder: 'New location name', required: 'true' }) as HTMLInputElement;
        const addLocationBtn = createEl('button', { type: 'submit' }, '+ Add Location');
        addLocationForm.appendChild(newLocationInput);
        addLocationForm.appendChild(addLocationBtn);
        addLocationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const loc = newLocationInput.value.trim();
            if (loc && !settings.locations.includes(loc)) {
                settings.locations.push(loc);
                saveSettings(settings);
                renderLocations();
                newLocationInput.value = '';
            }
        });
        settingsBox.appendChild(addLocationForm);

        // Asset Prefixes section
        const prefixesHeader = createEl('h3', { style: 'margin-top:24px' }, 'Asset ID Prefixes');
        settingsBox.appendChild(prefixesHeader);

        const prefixesList = createEl('div', { style: 'margin:8px 0' });
        const renderPrefixes = () => {
            prefixesList.innerHTML = '';
            settings.assetPrefixes.forEach((prefix, idx) => {
                const item = createEl('div', { style: 'display:flex;gap:8px;align-items:center;margin:4px 0' });
                item.appendChild(createEl('span', {}, prefix));
                const delBtn = createEl('button', { type: 'button' }, '🗑️');
                delBtn.addEventListener('click', () => {
                    settings.assetPrefixes.splice(idx, 1);
                    saveSettings(settings);
                    renderPrefixes();
                });
                item.appendChild(delBtn);
                prefixesList.appendChild(item);
            });
        };
        renderPrefixes();
        settingsBox.appendChild(prefixesList);

        const addPrefixForm = createEl('form', { style: 'display:flex;gap:8px;margin:8px 0' }) as HTMLFormElement;
        const newPrefixInput = createEl('input', { placeholder: 'New prefix (e.g., CAM, MIC)', required: 'true' }) as HTMLInputElement;
        const addPrefixBtn = createEl('button', { type: 'submit' }, '+ Add Prefix');
        addPrefixForm.appendChild(newPrefixInput);
        addPrefixForm.appendChild(addPrefixBtn);
        addPrefixForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const prefix = newPrefixInput.value.trim().toUpperCase();
            if (prefix && !settings.assetPrefixes.includes(prefix)) {
                settings.assetPrefixes.push(prefix);
                saveSettings(settings);
                renderPrefixes();
                newPrefixInput.value = '';
            }
        });
        settingsBox.appendChild(addPrefixForm);

        // Note about statuses
        const statusesNote = createEl('div', { style: 'margin-top:24px;padding:12px;background:#f5f5f5;border-radius:4px' });
        statusesNote.appendChild(createEl('h3', {}, 'Asset Statuses'));
        statusesNote.appendChild(createEl('p', { style: 'margin:8px 0;color:#666' }, 'Status options are fixed and include: Available, Broken, In Repair, Sold, Scrapped, Assigned to Person, and Installed. Status changes are made directly from the asset details.'));
        settingsBox.appendChild(statusesNote);

        // Close button
        const closeBtn = createEl('button', { type: 'button', style: 'margin-top:24px' }, 'Close');
        closeBtn.addEventListener('click', () => closeSettingsModal());
        settingsBox.appendChild(closeBtn);

        // Close on escape
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeSettingsModal();
        };
        document.addEventListener('keydown', onKeyDown);
        settingsModal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === settingsModal) closeSettingsModal();
        });

        function closeSettingsModal() {
            settingsModal.classList.remove('open');
            document.removeEventListener('keydown', onKeyDown);
            setTimeout(() => {
                if (!settingsModal.classList.contains('open')) settingsModal.style.display = 'none';
            }, 220);
        }
    }

    settingsBtn.addEventListener('click', () => openSettingsModal());

    // modal utilities: backdrop click to close, Escape key to close
    function closeModal() {
        // animate out
        modal.classList.remove('open');
        document.removeEventListener('keydown', onKeyDown);
        setTimeout(() => {
            if (!modal.classList.contains('open')) modal.style.display = 'none';
        }, 220);
    }

    function onBackdropClick(e: MouseEvent) {
        if (e.target === modal) closeModal();
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') closeModal();
    }

    modal.addEventListener('click', onBackdropClick);

    function openAssetModal(internalId?: string) {
        const existing = internalId ? items.find(i => i.id === internalId) : undefined;
    modalBox.innerHTML = '';
    // ensure visible before triggering transition
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('open'));
    // attach escape handler
    document.addEventListener('keydown', onKeyDown);
    
    // close (X) button top-right
    const xBtn = createEl('button', { type: 'button', class: 'modal-close-btn', 'aria-label': 'Close' }, '✕');
    xBtn.addEventListener('click', () => closeModal());
    modalBox.appendChild(xBtn);
    
    // Action buttons (will be created later but need to be positioned in header)
    const headerActions = createEl('div', { class: 'asset-modal-actions' });
    modalBox.appendChild(headerActions);
    
    // Header section with icon and asset name
    const header = createEl('div', { class: 'asset-modal-header' });
    
    // Icon upload area
    const iconContainer = createEl('div', { class: 'asset-icon-container' });
    const iconPreview = createEl('div', { class: 'asset-icon-preview' });
    
    // Check if there's an existing icon stored (we'll store as data URL in localStorage)
    const storedIcon = existing?.assetIcon;
    if (storedIcon) {
        const img = createEl('img', { src: storedIcon, alt: 'Asset icon' }) as HTMLImageElement;
        iconPreview.appendChild(img);
    } else {
        iconPreview.textContent = '📦';
    }
    
    const iconInput = createEl('input', { type: 'file', accept: 'image/*', style: 'display:none', id: 'asset-icon-upload' }) as HTMLInputElement;
    iconInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                iconPreview.innerHTML = '';
                const img = createEl('img', { src: dataUrl, alt: 'Asset icon' }) as HTMLImageElement;
                iconPreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
    
    const iconLabel = createEl('label', { 'for': 'asset-icon-upload', class: 'asset-icon-label' }, 'Click to upload icon');
    iconContainer.appendChild(iconPreview);
    iconContainer.appendChild(iconInput);
    iconContainer.appendChild(iconLabel);
    
    // Asset name (large, editable)
    const headerInfo = createEl('div', { class: 'asset-header-info' });
    const nameF = createEl('input', { 
        value: existing?.name ?? '', 
        placeholder: 'Asset Name',
        class: 'asset-name-input'
    }) as HTMLInputElement;
    headerInfo.appendChild(nameF);
    
    // Asset ID display under name
    let autoGeneratedAssetId: string | undefined = existing?.assetId;
    if (!existing && settings.assetPrefixes.length > 0) {
        try {
            autoGeneratedAssetId = nextAssetId(settings.assetPrefixes[0], items, prefixCounters);
        } catch (e) {
            console.error('Failed to auto-generate asset ID', e);
        }
    }
    
    const assetIdLine = createEl('div', { class: 'asset-id-display', 'data-role': 'asset-id' }, `ID: ${autoGeneratedAssetId ?? '(none)'}`);
    headerInfo.appendChild(assetIdLine);
    
    // Status badge in header
    let currentStatus = existing?.status || 'Available';
    const statusBadge = createEl('div', { class: 'asset-status-badge' }, currentStatus);
    headerInfo.appendChild(statusBadge);
    
    header.appendChild(iconContainer);
    header.appendChild(headerInfo);
    modalBox.appendChild(header);
    
    // Tab Section with Overview and History
    const tabSection = createEl('div', { class: 'asset-tabs' });
    const overviewTab = createEl('div', { class: 'asset-tab active', 'data-tab': 'overview' }, '📋 Overview');
    const historyTab = createEl('div', { class: 'asset-tab', 'data-tab': 'history' }, '📜 History');
    tabSection.appendChild(overviewTab);
    tabSection.appendChild(historyTab);
    modalBox.appendChild(tabSection);
    
    // Content containers for tabs
    const overviewContent = createEl('div', { class: 'tab-content active' });
    const historyContent = createEl('div', { class: 'tab-content', style: 'display:none' });
    
    // Tab switching logic
    const switchTab = (tabName: string) => {
        if (tabName === 'overview') {
            overviewTab.classList.add('active');
            historyTab.classList.remove('active');
            overviewContent.style.display = 'block';
            historyContent.style.display = 'none';
        } else {
            overviewTab.classList.remove('active');
            historyTab.classList.add('active');
            overviewContent.style.display = 'none';
            historyContent.style.display = 'block';
        }
    };
    
    overviewTab.addEventListener('click', () => switchTab('overview'));
    historyTab.addEventListener('click', () => switchTab('history'));
    
    // Form content
        const form = createEl('form', { class: 'asset-form' }) as HTMLFormElement;
        const manufacturerF = createEl('input', { value: existing?.manufacturer ?? '' }) as HTMLInputElement;
        const modelF = createEl('input', { value: existing?.model ?? '' }) as HTMLInputElement;
        const serialNumberF = createEl('input', { value: existing?.serialNumber ?? '' }) as HTMLInputElement;
        const qtyF = createEl('input', { type: 'number', value: String(existing?.quantity ?? 1) }) as HTMLInputElement;
        
        // Use searchable dropdown for location
        const locationDropdown = createSearchableDropdown(settings.locations, existing?.location, 'Select or type location...');
        
        // Status buttons instead of dropdown (reuse currentStatus from header)
        const statusButtonsWrapper = createEl('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;align-items:center' });
        const statusDisplay = createEl('div', { style: 'padding:6px 12px;background:#e3f2fd;border-radius:4px;font-weight:500' }, currentStatus);
        
        // Helper function to render status buttons
        const renderStatusButtons = () => {
            statusButtonsWrapper.innerHTML = '';
            statusDisplay.textContent = currentStatus;
            statusBadge.textContent = currentStatus; // Also update header badge
            statusButtonsWrapper.appendChild(statusDisplay);
            
            // Only show status change buttons for existing assets
            if (existing) {
                FIXED_STATUSES.forEach(status => {
                    if (status !== currentStatus) {
                        const btn = createEl('button', { type: 'button', style: 'padding:4px 8px;font-size:12px' }, status);
                        btn.addEventListener('click', () => {
                            currentStatus = status;
                            renderStatusButtons();
                        });
                        statusButtonsWrapper.appendChild(btn);
                    }
                });
            }
        };
        
        renderStatusButtons();
        
        // Use person searcher for assigned to
        const personSearcher = createPersonSearcher(existing?.assignedToPersonId, existing?.assignedToPersonName);
        
        const notesF = createEl('textarea', {}, existing?.notes ?? '') as HTMLTextAreaElement;
        const tagsF = createEl('input', { value: (existing?.tags ?? []).join(', ') }) as HTMLInputElement;
        
        // For new assets only, use dropdown for prefix selection
        let prefixDropdown: ReturnType<typeof createSearchableDropdown> | null = null;
        
        if (!existing) {
            // Use searchable dropdown for asset prefix - default to first prefix for new assets
            const defaultPrefix = settings.assetPrefixes.length > 0 ? settings.assetPrefixes[0] : '';
            prefixDropdown = createSearchableDropdown(settings.assetPrefixes, defaultPrefix, 'Select or type prefix...');
        }
        
        // Create buttons (to be placed in header)
        const saveBtn = createEl('button', { type: 'button', class: 'btn-primary' }, existing ? 'Save Changes' : 'Create Asset');
        const cancelBtn = createEl('button', { type: 'button', class: 'btn-secondary' }, 'Cancel');
        
        // Add buttons to header actions area
        headerActions.appendChild(cancelBtn);
        headerActions.appendChild(saveBtn);
        
        // Cancel button handler
        cancelBtn.addEventListener('click', () => closeModal());
        
        // Save button handler - manually trigger form processing
        saveBtn.addEventListener('click', () => {
            // Trigger the save logic
            processSave();
        });

        // build grid: label then field
        const addRow = (labelText: string, field: HTMLElement) => {
            form.appendChild(createEl('label', {}, labelText));
            form.appendChild(field);
        };

        addRow('Manufacturer', manufacturerF);
        addRow('Model', modelF);
        addRow('Serial Number', serialNumberF);
        addRow('Quantity', qtyF);
        addRow('Location', locationDropdown.wrapper);
        addRow('Status', statusButtonsWrapper);
        addRow('Assigned To', personSearcher.wrapper);
        addRow('Notes', notesF);
        addRow('Tags (comma separated)', tagsF);
        
        if (prefixDropdown) {
            addRow('Asset ID prefix', prefixDropdown.wrapper);
            
            // Add regenerate button for new assets
            const regenBtn = createEl('button', { type: 'button', class: 'btn-regen' }, '🔄 Regenerate ID');
            const regenRow = createEl('div', { style: 'grid-column: 2; margin-top: 8px' });
            regenRow.appendChild(regenBtn);
            form.appendChild(regenRow);
            
            regenBtn.addEventListener('click', () => {
                const prefix = prefixDropdown.getValue();
                if (!prefix) return alert('Enter prefix to generate');
                try {
                    const newAssetId = nextAssetId(prefix, items, prefixCounters);
                    tempAssetId = newAssetId;
                    assetIdLine.textContent = `ID: ${tempAssetId}`;
                    alert('Generated ' + newAssetId);
                } catch (e) {
                    alert(String(e));
                }
            });
        }
        
        // Audit info at bottom of form
        if (existing) {
            if (existing.createdBy && existing.createdAt) {
                const auditRow = createEl('div', { class: 'audit-info' });
                auditRow.textContent = `Created by ${existing.createdBy} on ${new Date(existing.createdAt).toLocaleString()}`;
                if (existing.updatedBy && existing.updatedAt) {
                    auditRow.textContent += ` • Last updated by ${existing.updatedBy} on ${new Date(existing.updatedAt).toLocaleString()}`;
                }
                form.appendChild(auditRow);
            }
        }

        overviewContent.appendChild(form);
        modalBox.appendChild(overviewContent);
        
        // Build History Content
        const historyList = createEl('div', { class: 'history-list' });
        if (existing?.history && existing.history.length > 0) {
            existing.history.forEach(entry => {
                const historyItem = createEl('div', { class: 'history-item' });
                
                const historyHeader = createEl('div', { class: 'history-header' });
                const timestamp = createEl('span', { class: 'history-timestamp' }, new Date(entry.timestamp).toLocaleString());
                const user = createEl('span', { class: 'history-user' }, entry.user);
                historyHeader.appendChild(timestamp);
                historyHeader.appendChild(user);
                
                const action = createEl('div', { class: 'history-action' }, entry.action);
                
                historyItem.appendChild(historyHeader);
                historyItem.appendChild(action);
                
                if (entry.changes && entry.changes.length > 0) {
                    const changesList = createEl('ul', { class: 'history-changes' });
                    entry.changes.forEach(change => {
                        const changeItem = createEl('li', {});
                        changeItem.textContent = `${change.field}: "${change.oldValue ?? 'none'}" → "${change.newValue ?? 'none'}"`;
                        changesList.appendChild(changeItem);
                    });
                    historyItem.appendChild(changesList);
                }
                
                historyList.appendChild(historyItem);
            });
        } else {
            const emptyState = createEl('div', { class: 'history-empty' }, '📜 No history yet. Changes will be recorded here.');
            historyList.appendChild(emptyState);
        }
        
        historyContent.appendChild(historyList);
        modalBox.appendChild(historyContent);

        // track a temporary asset id for create-mode
        let tempAssetId: string | undefined = autoGeneratedAssetId;

        // Extract save logic into a function that can be called by button click or form submit
        const processSave = () => {
            const now = fmtDate();
            
            // Get icon data URL if image was uploaded
            const iconImg = iconPreview.querySelector('img') as HTMLImageElement;
            const iconDataUrl = iconImg?.src || undefined;
            
            // Auto-set status to "Assigned to Person" if person is assigned
            const assignedPersonId = personSearcher.getPersonId();
            let finalStatus = currentStatus;
            if (assignedPersonId && currentStatus === 'Available') {
                finalStatus = 'Assigned to Person';
            } else if (!assignedPersonId && currentStatus === 'Assigned to Person') {
                finalStatus = 'Available';
            }
            
            if (existing) {
                // Track changes for history
                const changes: { field: string; oldValue?: string; newValue?: string }[] = [];
                
                const newName = nameF.value.trim() || existing.name;
                if (newName !== existing.name) changes.push({ field: 'Name', oldValue: existing.name, newValue: newName });
                
                const newManufacturer = manufacturerF.value.trim() || undefined;
                if (newManufacturer !== existing.manufacturer) changes.push({ field: 'Manufacturer', oldValue: existing.manufacturer, newValue: newManufacturer });
                
                const newModel = modelF.value.trim() || undefined;
                if (newModel !== existing.model) changes.push({ field: 'Model', oldValue: existing.model, newValue: newModel });
                
                const newSerialNumber = serialNumberF.value.trim() || undefined;
                if (newSerialNumber !== existing.serialNumber) changes.push({ field: 'Serial Number', oldValue: existing.serialNumber, newValue: newSerialNumber });
                
                const newQuantity = Number(qtyF.value) || existing.quantity;
                if (newQuantity !== existing.quantity) changes.push({ field: 'Quantity', oldValue: String(existing.quantity), newValue: String(newQuantity) });
                
                const newLocation = locationDropdown.getValue() || undefined;
                if (newLocation !== existing.location) changes.push({ field: 'Location', oldValue: existing.location, newValue: newLocation });
                
                if (finalStatus !== existing.status) changes.push({ field: 'Status', oldValue: existing.status, newValue: finalStatus });
                
                const newAssignedName = personSearcher.getPersonName() || undefined;
                if (newAssignedName !== existing.assignedToPersonName) changes.push({ field: 'Assigned To', oldValue: existing.assignedToPersonName, newValue: newAssignedName });
                
                const newNotes = notesF.value.trim() || undefined;
                if (newNotes !== existing.notes) changes.push({ field: 'Notes', oldValue: existing.notes, newValue: newNotes });
                
                // Add history entry if there are changes
                if (changes.length > 0) {
                    if (!existing.history) existing.history = [];
                    existing.history.unshift({
                        timestamp: now,
                        user: currentUserName,
                        action: 'Updated asset',
                        changes
                    });
                }
                
                existing.assetIcon = iconDataUrl;
                existing.name = newName;
                existing.manufacturer = newManufacturer;
                existing.model = newModel;
                existing.serialNumber = newSerialNumber;
                existing.quantity = newQuantity;
                existing.location = newLocation;
                existing.status = finalStatus;
                existing.assignedToPersonId = assignedPersonId;
                existing.assignedToPersonName = newAssignedName;
                existing.notes = newNotes;
                existing.tags = tagsF.value.split(',').map(s => s.trim()).filter(Boolean) || undefined;
                existing.updatedBy = currentUserName;
                existing.updatedAt = now;
                saveItems(items);
            } else {
                const id = genId();
                const newItem: InventoryItem = {
                    id,
                    assetId: tempAssetId,
                    assetIcon: iconDataUrl,
                    name: nameF.value.trim() || 'New Asset',
                    manufacturer: manufacturerF.value.trim() || undefined,
                    model: modelF.value.trim() || undefined,
                    serialNumber: serialNumberF.value.trim() || undefined,
                    quantity: Number(qtyF.value) || 1,
                    location: locationDropdown.getValue() || undefined,
                    status: finalStatus,
                    assignedToPersonId: assignedPersonId,
                    assignedToPersonName: personSearcher.getPersonName() || undefined,
                    notes: notesF.value.trim() || undefined,
                    tags: tagsF.value.split(',').map(s => s.trim()).filter(Boolean) || undefined,
                    createdBy: currentUserName,
                    createdAt: now,
                    updatedBy: currentUserName,
                    updatedAt: now,
                    history: [{
                        timestamp: now,
                        user: currentUserName,
                        action: 'Created asset',
                        changes: []
                    }]
                };
                items.push(newItem);
                saveItems(items);
            }
            renderAll();
            closeModal();
        };

        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            processSave();
        });
    }

    function renderKits() {
        kitsList.innerHTML = '';
        kits.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        for (const k of kits) {
            const box = createEl('div', { style: 'padding:8px;border:1px solid #eee;margin:6px 0' });
            box.appendChild(createEl('strong', {}, k.name));
            box.appendChild(createEl('div', {}, `Items: ${k.itemIds.map(id => items.find(i => i.id === id)?.name ?? id).join(', ')}`));
            box.appendChild(createEl('div', {}, `Notes: ${k.notes ?? ''}`));
            const del = createEl('button', { type: 'button' }, 'Delete');
            del.addEventListener('click', () => {
                if (!confirm(`Delete kit "${k.name}"?`)) return;
                kits = kits.filter(x => x.id !== k.id);
                saveKits(kits);
                renderKits();
            });
            box.appendChild(del);
            kitsList.appendChild(box);
        }
    }

    function hasBookingConflict(newStart: string, newEnd: string, newItemIds: string[], ignoreBookingId?: string) {
        const ns = new Date(newStart).getTime();
        const ne = new Date(newEnd).getTime();
        for (const b of bookings) {
            if (ignoreBookingId && b.id === ignoreBookingId) continue;
            const bs = new Date(b.start).getTime();
            const be = new Date(b.end).getTime();
            // overlap?
            if (ns < be && ne > bs) {
                // check shared items
                for (const id of newItemIds) {
                    if (b.itemIds.includes(id)) return { conflict: true, booking: b };
                }
            }
        }
        return { conflict: false };
    }

    function renderBookings() {
        bookingsList.innerHTML = '';
        bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        for (const bk of bookings) {
            const box = createEl('div', { style: 'padding:8px;border:1px solid #eee;margin:6px 0' });
            box.appendChild(createEl('strong', {}, bk.title));
            box.appendChild(createEl('div', {}, `From: ${new Date(bk.start).toLocaleString()} To: ${new Date(bk.end).toLocaleString()}`));
            box.appendChild(createEl('div', {}, `Items: ${bk.itemIds.map(id => items.find(i => i.id === id)?.name ?? id).join(', ')}`));
            const del = createEl('button', { type: 'button' }, 'Delete');
            del.addEventListener('click', () => {
                if (!confirm(`Delete booking "${bk.title}"?`)) return;
                bookings = bookings.filter(b => b.id !== bk.id);
                saveBookings(bookings);
                renderBookings();
            });
            box.appendChild(del);
            bookingsList.appendChild(box);
        }
    }

    function renderAll() {
        renderInventory();
        renderKits();
        renderBookings();
    }

    // Form handlers
    // New Asset button opens create modal
    newAssetBtn.addEventListener('click', () => openAssetModal());
    // Simple search behavior
    searchInput.addEventListener('input', async () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) { renderAll(); return; }
        tbody.innerHTML = '';
        const filtered = items.filter(it => 
            it.name.toLowerCase().includes(q) || 
            (it.manufacturer ?? '').toLowerCase().includes(q) ||
            (it.model ?? '').toLowerCase().includes(q) ||
            (it.serialNumber ?? '').toLowerCase().includes(q) ||
            (it.tags ?? []).some(t => t.toLowerCase().includes(q)) || 
            (it.assetId ?? '').toLowerCase().includes(q)
        );
        for (const it of filtered) {
            const tr = createEl('tr');
            tr.style.cursor = 'pointer';
            const td = (txt: string) => createEl('td', { style: 'padding:6px;border-top:1px solid #eee' }, txt);
            tr.appendChild(td(it.name));
            tr.appendChild(td(it.manufacturer ?? ''));
            tr.appendChild(td(it.model ?? ''));
            tr.appendChild(td(it.serialNumber ?? ''));
            tr.appendChild(td(String(it.quantity)));
            tr.appendChild(td(it.location ?? ''));
            tr.appendChild(td(it.status ?? ''));
            
            // Add assigned person with icon
            const assignedCell = await createAssignedPersonCell(it);
            tr.appendChild(assignedCell);
            
            tr.appendChild(td((it.tags ?? []).join(', ')));
            tr.appendChild(td(it.notes ?? ''));
            tr.appendChild(td(new Date(it.updatedAt).toLocaleString()));
            const actions = createEl('td', { style: 'padding:6px;border-top:1px solid #eee' });
            const del = createEl('button', { type: 'button' }, 'Delete');
            del.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click from triggering
                if (!confirm(`Delete \"${it.name}\"?`)) return;
                items = items.filter(x => x.id !== it.id);
                saveItems(items);
                renderAll();
            });
            actions.appendChild(del);
            tr.appendChild(actions);
            // Make entire row clickable to open modal
            tr.addEventListener('click', () => openAssetModal(it.id));
            tbody.appendChild(tr);
        }
    });

    // Kits handlers
    kitsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = kitName.value.trim();
        const notes = kitNotes.value.trim();
        const selected = Array.from(kitItemsSelect.selectedOptions).map(o => o.value);
        if (!name) return;
        const now = fmtDate();
        kits.push({ id: genId(), name, itemIds: selected, notes: notes || undefined, updatedAt: now });
        saveKits(kits);
        kitsForm.reset();
        renderKits();
    });

    // Bookings handlers
    bookingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = bookingTitle.value.trim();
        const start = bookingStart.value;
        const end = bookingEnd.value;
        const selected = Array.from(bookingItemsSelect.selectedOptions).map(o => o.value);
        if (!title || !start || !end) return;
        const conflict = hasBookingConflict(start, end, selected);
        if (conflict.conflict) {
            alert('Booking conflicts with existing booking: ' + conflict.booking?.title);
            return;
        }
        bookings.push({ id: genId(), title, start: new Date(start).toISOString(), end: new Date(end).toISOString(), itemIds: selected, createdAt: fmtDate() });
        saveBookings(bookings);
        bookingsForm.reset();
        renderBookings();
    });

    // Import / Export / Clear / Sync
    exportBtn.addEventListener('click', () => {
        const data = JSON.stringify({ items, kits, bookings }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = createEl('a', { href: url, download: 'inventory-export.json' }) as HTMLAnchorElement;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        const input = createEl('input', { type: 'file', accept: 'application/json' }) as HTMLInputElement;
        input.addEventListener('change', async () => {
            if (!input.files || !input.files[0]) return;
            try {
                const text = await input.files[0].text();
                const parsed = JSON.parse(text) as { items?: InventoryItem[]; kits?: Kit[]; bookings?: Booking[] } | InventoryItem[];
                if (Array.isArray(parsed)) {
                    // old format: items array
                    for (const p of parsed) {
                        if (!p.id) p.id = genId();
                        if (!p.updatedAt) p.updatedAt = fmtDate();
                    }
                    items = parsed;
                } else {
                    if (parsed.items) items = parsed.items.map(p => ({ ...p, id: p.id ?? genId(), updatedAt: p.updatedAt ?? fmtDate() }));
                    if (parsed.kits) kits = parsed.kits.map(k => ({ ...k, id: k.id ?? genId(), updatedAt: k.updatedAt ?? fmtDate() }));
                    if (parsed.bookings) bookings = parsed.bookings.map(b => ({ ...b, id: b.id ?? genId(), createdAt: b.createdAt ?? fmtDate() }));
                }
                saveItems(items);
                saveKits(kits);
                saveBookings(bookings);
                renderAll();
            } catch (e) {
                alert('Failed to import: ' + String(e));
            }
        });
        input.click();
    });

    clearBtn.addEventListener('click', () => {
        if (!confirm('Clear all inventory data (items, kits, bookings)?')) return;
        items = [];
        kits = [];
        bookings = [];
        saveItems(items);
        saveKits(kits);
        saveBookings(bookings);
        renderAll();
    });

    syncBtn.addEventListener('click', async () => {
        if (!options?.syncHandler) {
            alert('No sync handler configured. This button is a placeholder to connect to ChurchTools.');
            return;
        }
        try {
            syncBtn.setAttribute('disabled', 'true');
            await options.syncHandler(items);
            alert('Sync finished');
        } catch (e) {
            console.error(e);
            alert('Sync failed: ' + String(e));
        } finally {
            syncBtn.removeAttribute('disabled');
        }
    });

    // Tab switching
    function showSection(section: 'inventory' | 'kits' | 'bookings') {
        invSection.style.display = section === 'inventory' ? '' : 'none';
        kitsSection.style.display = section === 'kits' ? '' : 'none';
        bookingsSection.style.display = section === 'bookings' ? '' : 'none';
    }
    tabInventory.addEventListener('click', () => showSection('inventory'));
    tabKits.addEventListener('click', () => showSection('kits'));
    tabBookings.addEventListener('click', () => showSection('bookings'));

    // QR / Barcode scanning using BarcodeDetector if available, with camera & image fallback
    let stream: MediaStream | null = null;
    let scanning = false;
    const supportsBarcode = typeof (window as any).BarcodeDetector !== 'undefined';

    async function startCameraScan() {
        if (scanning) return;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            videoEl.srcObject = stream;
            videoEl.style.display = '';
            scanning = true;
            const detector = supportsBarcode ? new (window as any).BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128'] }) : null;
            const loop = async () => {
                if (!scanning) return;
                try {
                    if (detector) {
                        // BarcodeDetector can work with video element directly
                        const barcodes = await detector.detect(videoEl as unknown as ImageBitmapSource);
                        if (barcodes && barcodes.length) {
                            handleScannedCode(String(barcodes[0].rawValue));
                            stopCameraScan();
                            return;
                        }
                    } else {
                        // Fallback: draw frame to canvas and try to use detector if available
                        const ctx = canvasEl.getContext('2d');
                        if (ctx) {
                            canvasEl.width = videoEl.videoWidth;
                            canvasEl.height = videoEl.videoHeight;
                            ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
                        }
                    }
                } catch (e) {
                    console.error('Scan loop error', e);
                }
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        } catch (e) {
            alert('Camera access failed or denied.');
            console.error(e);
        }
    }

    function stopCameraScan() {
        scanning = false;
        videoEl.pause();
        videoEl.style.display = 'none';
        if (stream) {
            for (const t of stream.getTracks()) t.stop();
            stream = null;
        }
    }

    cameraBtn.addEventListener('click', () => {
        if (scanning) stopCameraScan(); else startCameraScan();
    });

    imageBtn.addEventListener('click', () => {
        const input = createEl('input', { type: 'file', accept: 'image/*' }) as HTMLInputElement;
        input.addEventListener('change', async () => {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            try {
                const bitmap = await createImageBitmap(file);
                const detector = supportsBarcode ? new (window as any).BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128'] }) : null;
                if (detector) {
                    const barcodes = await detector.detect(bitmap as unknown as ImageBitmap);
                    if (barcodes && barcodes.length) {
                        handleScannedCode(String(barcodes[0].rawValue));
                        return;
                    }
                }
                // fallback: no detector available -> ask user to paste code
                alert('No barcode decoder available in this browser. Please paste code manually.');
            } catch (e) {
                console.error('Image scan failed', e);
                alert('Failed to scan image');
            }
        });
        input.click();
    });

    manualBtn.addEventListener('click', () => {
        const code = manualCode.value.trim();
        if (!code) return alert('Paste a code first');
        handleScannedCode(code);
    });

    function handleScannedCode(code: string) {
        // try to find by id, tag, or name
        const foundById = items.find(i => i.id === code || (i.tags ?? []).includes(code) || i.assetId === code || i.name === code);
        if (foundById) {
            // open modal for found item
            openAssetModal(foundById.id);
            return;
        }
        // Not found -> offer to create new item with scanned code as tag
        if (confirm(`No item found for code "${code}". Create new item with this code as tag?`)) {
            const now = fmtDate();
            const newIt: InventoryItem = { id: genId(), name: `Scanned ${code}`, quantity: 1, tags: [code], updatedAt: now };
            items.push(newIt);
            saveItems(items);
            renderAll();
            alert('Created new item from scan');
        }
    }

    // initial render
    renderAll();

    // expose for testing/debugging
    (window as any).__ct_inventory = { loadItems, saveItems, loadKits, saveKits, loadBookings, saveBookings };
}
