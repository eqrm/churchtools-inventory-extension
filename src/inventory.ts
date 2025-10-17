// Main orchestration layer - coordinates UI components and state
import './inventory.css';

// Import from modular structure
import type { 
    InventoryItem, 
    Kit, 
    Booking, 
    InitOptions 
} from './inventory/types';
import { genId, fmtDate, createEl } from './inventory/utils';
import * as Storage from './inventory/services/storage.service';
import { ensurePrefixCountersFromItems } from './inventory/services/assetId.service';

// Import UI components
import { createAssetModal } from './inventory/ui/AssetModal';
import { createInventoryTable } from './inventory/ui/InventoryTable';
import { createSettingsModal } from './inventory/ui/SettingsModal';
import { createKitsSection } from './inventory/ui/KitsSection';
import { createBookingsSection } from './inventory/ui/BookingsSection';
import { createBatchScanModal } from './inventory/ui/BatchScanModal';

// Re-export types for external use
export type { InventoryItem, Kit, Booking, InventorySettings, PrefixCounters, InitOptions } from './inventory/types';

export async function initInventory(container: HTMLElement, options?: InitOptions) {
    container.innerHTML = '';
    container.classList.add('ct-inventory-root');

    const currentUserName = options?.currentUser ? `${options.currentUser.firstName} ${options.currentUser.lastName}` : 'Unknown User';

    // Load state from storage
    let items = await Storage.loadItems();
    let kits = await Storage.loadKits();
    let bookings = await Storage.loadBookings();
    let prefixCounters = await Storage.loadPrefixCounters();
    let settings = await Storage.loadSettings();

    // Ensure prefix counters are initialized
    await ensurePrefixCountersFromItems(items, prefixCounters);

    // Header & navigation
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

    // Main content area
    const content = createEl('div');
    container.appendChild(content);

    // Inventory section
    const invSection = createEl('div');
    const toolbar = createEl('div', { style: 'display:flex;gap:8px;align-items:center;margin:8px 0' });
    const newAssetBtn = createEl('button', { type: 'button' }, '➕ New Asset');
    const batchScanBtn = createEl('button', { type: 'button' }, '🔍 Batch Scan');
    const searchInput = createEl('input', { placeholder: 'Search name, tag or asset id', style: 'margin-left:8px;padding:6px;border:1px solid var(--ct-border);border-radius:6px' }) as HTMLInputElement;
    toolbar.appendChild(newAssetBtn);
    toolbar.appendChild(batchScanBtn);
    toolbar.appendChild(searchInput);
    invSection.appendChild(toolbar);

    // Create UI components
    const inventoryTable = createInventoryTable(invSection);
    const assetModal = createAssetModal(document.body, items, settings, prefixCounters, currentUserName);
    const settingsModal = createSettingsModal(document.body);
    const batchScanModal = createBatchScanModal(document.body, items, settings, currentUserName);
    const kitsSection = createKitsSection(content);
    const bookingsSection = createBookingsSection(content);

    content.appendChild(invSection);

    // Batch scan button handler
    batchScanBtn.addEventListener('click', () => {
        batchScanModal.open({
            onUpdate: async () => {
                // Items are already updated in-place by batch scan modal
                await Storage.saveItems(items);
                await Storage.saveSettings(settings);
                await renderAll();
            },
            onClose: () => {}
        });
    });

    // Table callbacks
    async function renderInventory() {
        await inventoryTable.render(items, {
            onRowClick: (itemId) => {
                assetModal.open(itemId, {
                    onSave: async (item, isNew) => {
                        if (isNew) {
                            items.push(item);
                        }
                        await Storage.saveItems(items);
                        await renderAll();
                    },
                    onClose: () => {}
                });
            },
            onDelete: async (itemId) => {
                items = items.filter(x => x.id !== itemId);
                await Storage.saveItems(items);
                await renderAll();
            }
        });
        
        // Update selects in kits and bookings
        kitsSection.updateItemsSelect(items);
        bookingsSection.updateItemsSelect(items);
    }

    // Kits callbacks
    function renderKits() {
        kitsSection.render(kits, items, {
            onSave: async (updatedKits) => {
                kits = updatedKits;
                await Storage.saveKits(kits);
                renderKits();
            }
        });
    }

    kitsSection.addEventListener('kit-submit', async (e: Event) => {
        const detail = (e as CustomEvent).detail;
        const now = fmtDate();
        kits.push({ 
            id: genId(), 
            name: detail.name, 
            itemIds: detail.itemIds, 
            notes: detail.notes || undefined, 
            updatedAt: now 
        });
        await Storage.saveKits(kits);
        renderKits();
    });

    // Bookings callbacks
    function hasBookingConflict(newStart: string, newEnd: string, newItemIds: string[], ignoreBookingId?: string) {
        const ns = new Date(newStart).getTime();
        const ne = new Date(newEnd).getTime();
        for (const b of bookings) {
            if (ignoreBookingId && b.id === ignoreBookingId) continue;
            const bs = new Date(b.start).getTime();
            const be = new Date(b.end).getTime();
            if (ns < be && ne > bs) {
                for (const id of newItemIds) {
                    if (b.itemIds.includes(id)) return { conflict: true, booking: b };
                }
            }
        }
        return { conflict: false };
    }

    function renderBookings() {
        bookingsSection.render(bookings, items, {
            onSave: async (updatedBookings) => {
                bookings = updatedBookings;
                await Storage.saveBookings(bookings);
                renderBookings();
            },
            onConflictCheck: hasBookingConflict
        });
    }

    bookingsSection.addEventListener('booking-submit', async (e: Event) => {
        const detail = (e as CustomEvent).detail;
        const conflict = hasBookingConflict(detail.start, detail.end, detail.itemIds);
        if (conflict.conflict) {
            alert('Booking conflicts with existing booking: ' + conflict.booking?.title);
            return;
        }
        bookings.push({ 
            id: genId(), 
            title: detail.title, 
            start: detail.start, 
            end: detail.end, 
            itemIds: detail.itemIds, 
            createdAt: fmtDate() 
        });
        await Storage.saveBookings(bookings);
        renderBookings();
    });

    // Render all sections
    async function renderAll() {
        await renderInventory();
        renderKits();
        renderBookings();
    }

    // New Asset button
    newAssetBtn.addEventListener('click', () => {
        assetModal.open(undefined, {
            onSave: async (item, isNew) => {
                if (isNew) {
                    items.push(item);
                }
                await Storage.saveItems(items);
                await renderAll();
            },
            onClose: () => {}
        });
    });

    // Search functionality
    searchInput.addEventListener('input', async () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) { 
            await renderAll(); 
            return; 
        }
        const filtered = items.filter(it => 
            it.name.toLowerCase().includes(q) || 
            (it.manufacturer ?? '').toLowerCase().includes(q) ||
            (it.model ?? '').toLowerCase().includes(q) ||
            (it.serialNumber ?? '').toLowerCase().includes(q) ||
            (it.tags ?? []).some(t => t.toLowerCase().includes(q)) || 
            (it.assetId ?? '').toLowerCase().includes(q)
        );
        await inventoryTable.render(filtered, {
            onRowClick: (itemId) => {
                assetModal.open(itemId, {
                    onSave: async (item, isNew) => {
                        if (isNew) {
                            items.push(item);
                        }
                        await Storage.saveItems(items);
                        await renderAll();
                    },
                    onClose: () => {}
                });
            },
            onDelete: async (itemId) => {
                items = items.filter(x => x.id !== itemId);
                await Storage.saveItems(items);
                await renderAll();
            }
        });
    });

    // Settings button
    settingsBtn.addEventListener('click', () => {
        settingsModal.open(settings, {
            onSave: async (updatedSettings) => {
                settings = updatedSettings;
                await Storage.saveSettings(settings);
            },
            onClose: () => {},
            getItems: () => items
        });
    });

    // Import/Export/Clear/Sync
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
                await Storage.saveItems(items);
                await Storage.saveKits(kits);
                await Storage.saveBookings(bookings);
                await renderAll();
            } catch (e) {
                alert('Failed to import: ' + String(e));
            }
        });
        input.click();
    });

    clearBtn.addEventListener('click', async () => {
        if (!confirm('Clear all inventory data (items, kits, bookings)?')) return;
        items = [];
        kits = [];
        bookings = [];
        await Storage.saveItems(items);
        await Storage.saveKits(kits);
        await Storage.saveBookings(bookings);
        await renderAll();
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
        kitsSection.element.style.display = section === 'kits' ? '' : 'none';
        bookingsSection.element.style.display = section === 'bookings' ? '' : 'none';
    }
    tabInventory.addEventListener('click', () => showSection('inventory'));
    tabKits.addEventListener('click', () => showSection('kits'));
    tabBookings.addEventListener('click', () => showSection('bookings'));

    // Initial render
    await renderAll();

    // Expose for testing/debugging
    (window as any).__ct_inventory = { 
        loadItems: Storage.loadItems, 
        saveItems: Storage.saveItems, 
        loadKits: Storage.loadKits, 
        saveKits: Storage.saveKits, 
        loadBookings: Storage.loadBookings, 
        saveBookings: Storage.saveBookings 
    };
}
