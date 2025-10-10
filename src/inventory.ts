// Lightweight inventory management UI and persistence for the extension boilerplate.
// Stores items in localStorage under key 'ct-inventory-items'.

// Expanded Inventory module with QR scanning (camera + image fallback) and simple Kits & Bookings
// Inject minimal styles at runtime (no external CSS file required)
function injectInventoryStyles() {
    if (document.getElementById('ct-inventory-styles')) return;
    const css = `:root{--ct-accent:#2563eb;--ct-border:#e5e7eb;--ct-radius:8px;--ct-muted:#6b7280} .ct-inventory-root{font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;color:#0f172a;background:#fff;padding:12px} .ct-inventory-root h1{font-size:18px;margin:0;display:flex;align-items:center;gap:8px} .ct-inventory-root button{background:white;border:1px solid var(--ct-border);padding:6px 10px;border-radius:6px;cursor:pointer;transition:all .12s ease;color:#0f172a} .ct-inventory-root button:hover{transform: translateY(-1px);box-shadow:0 4px 10px rgba(2,6,23,0.06)} .ct-inventory-root form input,.ct-inventory-root form select{padding:8px 10px;border:1px solid var(--ct-border);border-radius:6px}
    /* Modal overlay and animation */
    .ct-asset-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);opacity:0;pointer-events:none;transition:opacity .18s ease}
    .ct-asset-modal.open{opacity:1;pointer-events:auto}
    .ct-asset-modal .box{background:white;padding:18px;border-radius:8px;max-width:920px;width:92%;max-height:92%;overflow:auto;transform:translateY(8px) scale(.98);opacity:0;transition:transform .18s ease,opacity .18s ease;position:relative;box-shadow:0 8px 30px rgba(2,6,23,0.06)}
    .ct-asset-modal.open .box{transform:translateY(0) scale(1);opacity:1}
    /* X close button */
    .ct-asset-modal .modal-close-btn{position:absolute;top:12px;right:12px;background:transparent;border:0;padding:8px;border-radius:6px;font-size:18px;line-height:1;cursor:pointer;color:var(--ct-muted)}
    .ct-asset-modal .modal-close-btn:hover{background:rgba(0,0,0,0.04)}

    /* Form grid similar to reference: label column + field column */
    .ct-asset-modal .box form{display:grid;grid-template-columns:220px 1fr;gap:12px 18px;align-items:start}
    .ct-asset-modal .box form label{justify-self:end;padding-top:6px;color:var(--ct-muted);font-size:13px}
    .ct-asset-modal .box form input[type="text"],.ct-asset-modal .box form input[type="number"],.ct-asset-modal .box form input[type="datetime-local"],.ct-asset-modal .box form select,.ct-asset-modal .box form textarea{width:100%;box-sizing:border-box;border:1px solid var(--ct-border);padding:10px;border-radius:6px;background:#fff}
    .ct-asset-modal .box form textarea{min-height:120px}
    .ct-asset-modal .box .small-muted{grid-column:1 / span 1;justify-self:end}
    /* put actions full width */
    .ct-asset-modal .box form .form-action{grid-column:1 / span 2;display:flex;gap:8px;justify-content:flex-end;margin-top:6px}
    .ct-asset-modal .box form .form-action button{min-width:110px}

    /* Asset ID mono display */
    .ct-asset-modal .box [data-role="asset-id"]{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace;color:var(--ct-muted);margin-bottom:6px}

    @media (max-width:700px){.ct-inventory-root form{display:flex;flex-direction:column;gap:8px}.ct-inventory-root form input,.ct-inventory-root form select{width:100%}.ct-asset-modal .box form{grid-template-columns:1fr;}.ct-asset-modal .box form label{justify-self:start}}
    `;
    const s = document.createElement('style');
    s.id = 'ct-inventory-styles';
    s.textContent = css;
    document.head.appendChild(s);
}
export type InventoryItem = {
    // internal stable id (never changes)
    id: string;
    // human visible asset id with prefix (optional)
    assetId?: string;
    name: string;
    quantity: number;
    location?: string;
    notes?: string;
    tags?: string[];
    updatedAt: string;
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

type PrefixCounters = Record<string, number>;

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

type InitOptions = {
    syncHandler?: (items: InventoryItem[]) => Promise<void>;
};

export function initInventory(container: HTMLElement, options?: InitOptions) {
    injectInventoryStyles();
    container.innerHTML = '';
    // root class for styling
    container.classList.add('ct-inventory-root');

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
    const importBtn = createEl('button', { type: 'button' }, 'Import JSON');
    const exportBtn = createEl('button', { type: 'button' }, 'Export JSON');
    const clearBtn = createEl('button', { type: 'button' }, 'Clear all');
    const syncBtn = createEl('button', { type: 'button' }, 'Sync (optional)');
    [importBtn, exportBtn, clearBtn, syncBtn].forEach(b => { b.style.marginLeft = '6px'; header.appendChild(b); });

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
    ['Name', 'Quantity', 'Location', 'Tags', 'Notes', 'Updated', 'Actions'].forEach(h => {
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

    function renderInventory() {
        tbody.innerHTML = '';
        items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        for (const it of items) {
            const tr = createEl('tr');
            const td = (txt: string) => createEl('td', { style: 'padding:6px;border-top:1px solid #eee' }, txt);
            tr.appendChild(td(it.name));
            tr.appendChild(td(String(it.quantity)));
            tr.appendChild(td(it.location ?? ''));
            tr.appendChild(td((it.tags ?? []).join(', ')));
            tr.appendChild(td(it.notes ?? ''));
            tr.appendChild(td(new Date(it.updatedAt).toLocaleString()));
            const actions = createEl('td', { style: 'padding:6px;border-top:1px solid #eee' });
            const edit = createEl('button', { type: 'button' }, 'Edit');
            const del = createEl('button', { type: 'button' }, 'Delete');
            const view = createEl('button', { type: 'button' }, 'View');
            view.addEventListener('click', () => openAssetModal(it.id));
            edit.addEventListener('click', () => openAssetModal(it.id));
            del.addEventListener('click', () => {
                if (!confirm(`Delete "${it.name}"?`)) return;
                items = items.filter(x => x.id !== it.id);
                saveItems(items);
                renderAll();
            });
            actions.appendChild(edit);
            actions.appendChild(view);
            actions.appendChild(del);
            tr.appendChild(actions);
            tbody.appendChild(tr);
        }
        refreshSelects();
    }

    // Asset detail modal
    const modal = createEl('div', { class: 'ct-asset-modal' });
    const modalBox = createEl('div', { class: 'box' });
    modal.appendChild(modalBox);
    document.body.appendChild(modal);

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
    const title = createEl('h2', {}, existing ? `Asset: ${existing.name}` : 'New Asset');
    modalBox.appendChild(title);
    // internal ID shown as part of the grid (label + value)
    const internalLabel = createEl('label', {}, 'Internal ID');
    const internalIdLine = createEl('div', { class: 'small-muted' }, `${existing?.id ?? '(new)'}`);
    modalBox.appendChild(internalLabel);
    modalBox.appendChild(internalIdLine);
    // asset id display (separate element so we can update it safely) - monospace value
    const assetLabel = createEl('label', {}, 'Asset ID');
    const assetIdLine = createEl('div', { class: 'small-muted', 'data-role': 'asset-id' }, `${existing?.assetId ?? '(none)'}`);
    modalBox.appendChild(assetLabel);
    modalBox.appendChild(assetIdLine);
        const form = createEl('form', { style: 'margin-top:8px' }) as HTMLFormElement;
        const nameF = createEl('input', { value: existing?.name ?? '' }) as HTMLInputElement;
        const qtyF = createEl('input', { type: 'number', value: String(existing?.quantity ?? 1) }) as HTMLInputElement;
        const locF = createEl('input', { value: existing?.location ?? '' }) as HTMLInputElement;
        const notesF = createEl('textarea', {}, existing?.notes ?? '') as HTMLTextAreaElement;
        const tagsF = createEl('input', { value: (existing?.tags ?? []).join(', ') }) as HTMLInputElement;
        const assetPrefixF = createEl('input', { placeholder: 'Prefix to (re)generate asset ID - leave empty to keep' }) as HTMLInputElement;
        const regenBtn = createEl('button', { type: 'button' }, 'Regenerate Asset ID');
        const saveBtn = createEl('button', { type: 'submit' }, existing ? 'Save' : 'Create');
        const closeBtn = createEl('button', { type: 'button' }, 'Close');

        // build grid: label then field
        const addRow = (labelText: string, field: HTMLElement) => {
            form.appendChild(createEl('label', {}, labelText));
            form.appendChild(field);
        };

        addRow('Name', nameF);
        addRow('Quantity', qtyF);
        addRow('Location', locF);
        addRow('Notes', notesF);
        addRow('Tags (comma separated)', tagsF);
        addRow('Asset ID prefix (optional)', assetPrefixF);

        // actions row spanning both columns
        const actionsWrap = createEl('div', { class: 'form-action' });
        actionsWrap.appendChild(regenBtn);
        actionsWrap.appendChild(saveBtn);
        actionsWrap.appendChild(closeBtn);
        form.appendChild(actionsWrap);
        modalBox.appendChild(form);

        // track a temporary asset id for create-mode
        let tempAssetId: string | undefined = existing?.assetId;

        regenBtn.addEventListener('click', () => {
            const prefix = assetPrefixF.value.trim();
            if (!prefix) return alert('Enter prefix to generate');
            try {
                const newAssetId = nextAssetId(prefix, items, prefixCounters);
                tempAssetId = newAssetId;
                assetIdLine.textContent = `Asset ID: ${tempAssetId}`;
                if (existing) {
                    existing.assetId = newAssetId;
                    saveItems(items);
                    renderAll();
                }
                alert('Generated ' + newAssetId);
            } catch (e) {
                alert(String(e));
            }
        });

        form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const now = fmtDate();
            if (existing) {
                existing.name = nameF.value.trim() || existing.name;
                existing.quantity = Number(qtyF.value) || existing.quantity;
                existing.location = locF.value.trim() || undefined;
                existing.notes = notesF.value.trim() || undefined;
                existing.tags = tagsF.value.split(',').map(s => s.trim()).filter(Boolean) || undefined;
                if (tempAssetId) existing.assetId = tempAssetId;
                existing.updatedAt = now;
                saveItems(items);
            } else {
                const id = genId();
                const newItem: InventoryItem = {
                    id,
                    assetId: tempAssetId,
                    name: nameF.value.trim() || 'New Asset',
                    quantity: Number(qtyF.value) || 1,
                    location: locF.value.trim() || undefined,
                    notes: notesF.value.trim() || undefined,
                    tags: tagsF.value.split(',').map(s => s.trim()).filter(Boolean) || undefined,
                    updatedAt: now,
                };
                items.push(newItem);
                saveItems(items);
            }
            renderAll();
            closeModal();
        });

        closeBtn.addEventListener('click', () => { closeModal(); });
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
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) { renderAll(); return; }
        tbody.innerHTML = '';
        const filtered = items.filter(it => it.name.toLowerCase().includes(q) || (it.tags ?? []).some(t => t.toLowerCase().includes(q)) || (it.assetId ?? '').toLowerCase().includes(q));
        for (const it of filtered) {
            const tr = createEl('tr');
            const td = (txt: string) => createEl('td', { style: 'padding:6px;border-top:1px solid #eee' }, txt);
            tr.appendChild(td(it.name));
            tr.appendChild(td(String(it.quantity)));
            tr.appendChild(td(it.location ?? ''));
            tr.appendChild(td((it.tags ?? []).join(', ')));
            tr.appendChild(td(it.notes ?? ''));
            tr.appendChild(td(new Date(it.updatedAt).toLocaleString()));
            const actions = createEl('td', { style: 'padding:6px;border-top:1px solid #eee' });
            const edit = createEl('button', { type: 'button' }, 'Edit');
            const del = createEl('button', { type: 'button' }, 'Delete');
            const view = createEl('button', { type: 'button' }, 'View');
            view.addEventListener('click', () => openAssetModal(it.id));
            edit.addEventListener('click', () => openAssetModal(it.id));
            del.addEventListener('click', () => {
                if (!confirm(`Delete \"${it.name}\"?`)) return;
                items = items.filter(x => x.id !== it.id);
                saveItems(items);
                renderAll();
            });
            actions.appendChild(edit);
            actions.appendChild(view);
            actions.appendChild(del);
            tr.appendChild(actions);
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
