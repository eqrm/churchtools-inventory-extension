// Inventory table UI component with filtering and sorting
import type { InventoryItem } from '../types';
import { createEl } from '../utils';
import { churchtoolsClient } from '@churchtools/churchtools-client';

export interface InventoryTableCallbacks {
    onRowClick: (itemId: string) => void;
    onDelete: (itemId: string) => Promise<void>;
}

type SortColumn = 'name' | 'manufacturer' | 'model' | 'location' | 'status' | 'assignedTo' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export function createInventoryTable(container: HTMLElement) {
    // State for sorting and filtering
    let currentSort: { column: SortColumn; direction: SortDirection } = { column: 'updatedAt', direction: 'desc' };
    let filters: Record<string, Set<string>> = {};
    let allItems: InventoryItem[] = [];
    let currentCallbacks: InventoryTableCallbacks | undefined;
    let activePopup: HTMLElement | null = null;
    
    // Create table wrapper
    const wrapper = createEl('div', { style: 'position:relative' });
    
    // Table
    const table = createEl('table', { border: '1', style: 'width:100%;border-collapse:collapse;margin-top:8px' });
    const thead = createEl('thead');
    const headRow = createEl('tr');
    
    // Column definitions with sorting/filtering capability
    const columns = [
        { label: 'Name', key: 'name', filterable: false },
        { label: 'Manufacturer', key: 'manufacturer', filterable: true },
        { label: 'Model', key: 'model', filterable: true },
        { label: 'Serial Number', key: null, filterable: false },
        { label: 'Barcode', key: null, filterable: false },
        { label: 'Quantity', key: null, filterable: false },
        { label: 'Location', key: 'location', filterable: true },
        { label: 'Status', key: 'status', filterable: true },
        { label: 'Assigned To', key: 'assignedTo', filterable: true },
        { label: 'Tags', key: null, filterable: false },
        { label: 'Notes', key: null, filterable: false },
        { label: 'Updated', key: 'updatedAt', filterable: false },
        { label: 'Actions', key: null, filterable: false }
    ];
    
    // Function to close any open popup
    function closePopup() {
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
        }
    }
    
    // Function to create filter/sort popup
    function createColumnPopup(column: typeof columns[number], th: HTMLElement) {
        closePopup();
        
        const popup = createEl('div', {
            style: 'position:absolute;background:white;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:8px;min-width:200px;z-index:1000'
        });
        
        // Position popup below the header
        const rect = th.getBoundingClientRect();
        const tableRect = wrapper.getBoundingClientRect();
        popup.style.left = `${rect.left - tableRect.left}px`;
        popup.style.top = `${rect.bottom - tableRect.top + 4}px`;
        
        // Sort section
        if (column.key) {
            const sortSection = createEl('div', { style: 'border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:8px' });
            const sortTitle = createEl('div', { style: 'font-size:11px;color:#666;margin-bottom:4px;font-weight:600' }, 'SORT');
            sortSection.appendChild(sortTitle);
            
            const sortAsc = createEl('button', {
                type: 'button',
                style: 'display:block;width:100%;text-align:left;padding:6px 8px;border:none;background:none;cursor:pointer;border-radius:4px'
            });
            sortAsc.innerHTML = `<span style="margin-right:8px">↑</span> Sort ascending`;
            sortAsc.addEventListener('mouseenter', () => sortAsc.style.background = '#f5f5f5');
            sortAsc.addEventListener('mouseleave', () => sortAsc.style.background = 'none');
            sortAsc.addEventListener('click', () => {
                currentSort = { column: column.key as SortColumn, direction: 'asc' };
                renderTable();
                closePopup();
            });
            
            const sortDesc = createEl('button', {
                type: 'button',
                style: 'display:block;width:100%;text-align:left;padding:6px 8px;border:none;background:none;cursor:pointer;border-radius:4px'
            });
            sortDesc.innerHTML = `<span style="margin-right:8px">↓</span> Sort descending`;
            sortDesc.addEventListener('mouseenter', () => sortDesc.style.background = '#f5f5f5');
            sortDesc.addEventListener('mouseleave', () => sortDesc.style.background = 'none');
            sortDesc.addEventListener('click', () => {
                currentSort = { column: column.key as SortColumn, direction: 'desc' };
                renderTable();
                closePopup();
            });
            
            sortSection.appendChild(sortAsc);
            sortSection.appendChild(sortDesc);
            popup.appendChild(sortSection);
        }
        
        // Filter section
        if (column.filterable && column.key) {
            const filterSection = createEl('div', { style: 'max-height:300px;overflow-y:auto' });
            const filterTitle = createEl('div', { style: 'font-size:11px;color:#666;margin-bottom:4px;font-weight:600' }, 'FILTER');
            filterSection.appendChild(filterTitle);
            
            // Get unique values for this column
            const uniqueValues = new Set<string>();
            allItems.forEach(item => {
                let value: string | undefined;
                switch (column.key) {
                    case 'manufacturer':
                        value = item.manufacturer;
                        break;
                    case 'model':
                        value = item.model;
                        break;
                    case 'location':
                        value = item.location;
                        break;
                    case 'status':
                        value = item.status;
                        break;
                    case 'assignedTo':
                        value = item.assignedToPersonName;
                        break;
                }
                if (value) uniqueValues.add(value);
            });
            
            const currentFilters = filters[column.key] || new Set<string>();
            
            // Clear filter button
            if (currentFilters.size > 0) {
                const clearBtn = createEl('button', {
                    type: 'button',
                    style: 'display:block;width:100%;text-align:left;padding:6px 8px;border:none;background:none;cursor:pointer;border-radius:4px;color:#e74c3c;font-weight:500'
                }, '✕ Clear filter');
                clearBtn.addEventListener('mouseenter', () => clearBtn.style.background = '#fee');
                clearBtn.addEventListener('mouseleave', () => clearBtn.style.background = 'none');
                clearBtn.addEventListener('click', () => {
                    delete filters[column.key!];
                    renderTable();
                    closePopup();
                });
                filterSection.appendChild(clearBtn);
            }
            
            // Filter options
            Array.from(uniqueValues).sort().forEach(value => {
                const isChecked = currentFilters.has(value);
                const option = createEl('label', {
                    style: 'display:flex;align-items:center;padding:6px 8px;cursor:pointer;border-radius:4px;gap:8px'
                });
                
                const checkbox = createEl('input', { type: 'checkbox' }) as HTMLInputElement;
                checkbox.checked = isChecked;
                checkbox.addEventListener('change', () => {
                    if (!filters[column.key!]) {
                        filters[column.key!] = new Set();
                    }
                    if (checkbox.checked) {
                        filters[column.key!].add(value);
                    } else {
                        filters[column.key!].delete(value);
                        if (filters[column.key!].size === 0) {
                            delete filters[column.key!];
                        }
                    }
                    renderTable();
                });
                
                option.appendChild(checkbox);
                option.appendChild(createEl('span', {}, value));
                option.addEventListener('mouseenter', () => option.style.background = '#f5f5f5');
                option.addEventListener('mouseleave', () => option.style.background = 'none');
                
                filterSection.appendChild(option);
            });
            
            popup.appendChild(filterSection);
        }
        
        activePopup = popup;
        wrapper.appendChild(popup);
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeOnClickOutside(e) {
                if (!popup.contains(e.target as Node) && !th.contains(e.target as Node)) {
                    closePopup();
                    document.removeEventListener('click', closeOnClickOutside);
                }
            });
        }, 0);
    }
    
    columns.forEach(col => {
        const th = createEl('th', { style: 'padding:6px;background:#f3f3f3;text-align:left;position:relative' });
        
        if (col.key) {
            const headerBtn = createEl('button', { 
                type: 'button',
                style: 'background:none;border:none;cursor:pointer;font-weight:bold;padding:4px;text-align:left;width:100%'
            });
            
            // Build the button text content directly
            headerBtn.textContent = col.label;
            
            // Add sort indicator
            if (currentSort.column === col.key) {
                headerBtn.textContent += currentSort.direction === 'asc' ? ' ▲' : ' ▼';
            }
            
            // Add filter badge
            if (filters[col.key] && filters[col.key].size > 0) {
                headerBtn.textContent += ` [${filters[col.key].size}]`;
            }
            
            headerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                createColumnPopup(col, th);
            });
            
            th.appendChild(headerBtn);
        } else {
            th.textContent = col.label;
        }
        
        headRow.appendChild(th);
    });
    
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = createEl('tbody');
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);

    async function createAssignedPersonCell(item: InventoryItem) {
        const cell = createEl('td', { style: 'padding:6px;border-top:1px solid #eee' });
        
        if (!item.assignedToPersonId || !item.assignedToPersonName) {
            return cell;
        }
        
        const wrapper = createEl('div', { style: 'display:flex;align-items:center;gap:6px' });
        
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
                const initials = item.assignedToPersonName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const initialsCircle = createEl('div', { 
                    style: 'width:20px;height:20px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#6b7280;flex-shrink:0'
                }, initials);
                wrapper.appendChild(initialsCircle);
            }
        } catch (e) {
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

    async function render(items: InventoryItem[], callbacks?: InventoryTableCallbacks) {
        allItems = items;
        currentCallbacks = callbacks;
        
        // Render the table with current filters and sorting
        await renderTable();
    }
    
    async function renderTable() {
        tbody.innerHTML = '';
        
        // Apply filters
        let filteredItems = allItems.filter(item => {
            for (const [key, valueSet] of Object.entries(filters)) {
                if (valueSet.size === 0) continue;
                
                let itemValue: string | undefined;
                switch (key) {
                    case 'manufacturer':
                        itemValue = item.manufacturer;
                        break;
                    case 'model':
                        itemValue = item.model;
                        break;
                    case 'location':
                        itemValue = item.location;
                        break;
                    case 'status':
                        itemValue = item.status;
                        break;
                    case 'assignedTo':
                        itemValue = item.assignedToPersonName;
                        break;
                }
                
                if (!itemValue || !valueSet.has(itemValue)) {
                    return false;
                }
            }
            return true;
        });
        
        // Apply sorting
        filteredItems.sort((a, b) => {
            let aVal: any;
            let bVal: any;
            
            switch (currentSort.column) {
                case 'name':
                    aVal = a.name || '';
                    bVal = b.name || '';
                    break;
                case 'manufacturer':
                    aVal = a.manufacturer || '';
                    bVal = b.manufacturer || '';
                    break;
                case 'model':
                    aVal = a.model || '';
                    bVal = b.model || '';
                    break;
                case 'location':
                    aVal = a.location || '';
                    bVal = b.location || '';
                    break;
                case 'status':
                    aVal = a.status || '';
                    bVal = b.status || '';
                    break;
                case 'assignedTo':
                    aVal = a.assignedToPersonName || '';
                    bVal = b.assignedToPersonName || '';
                    break;
                case 'updatedAt':
                default:
                    aVal = a.updatedAt;
                    bVal = b.updatedAt;
                    break;
            }
            
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return currentSort.direction === 'asc' ? comparison : -comparison;
        });
        
        // Update sort icons
        const sortButtons = thead.querySelectorAll('button');
        sortButtons.forEach((btn, index) => {
            const col = columns.filter(c => c.key)[index];
            if (!col || !col.key) return;
            
            // Rebuild button text
            btn.textContent = col.label;
            
            if (currentSort.column === col.key) {
                btn.textContent += currentSort.direction === 'asc' ? ' ▲' : ' ▼';
            }
            
            if (filters[col.key] && filters[col.key].size > 0) {
                btn.textContent += ` [${filters[col.key].size}]`;
            }
        });
        
        // Render rows
        for (const it of filteredItems) {
            const tr = createEl('tr');
            tr.style.cursor = 'pointer';
            const td = (txt: string) => createEl('td', { style: 'padding:6px;border-top:1px solid #eee' }, txt);
            
            tr.appendChild(td(it.name));
            tr.appendChild(td(it.manufacturer ?? ''));
            tr.appendChild(td(it.model ?? ''));
            tr.appendChild(td(it.serialNumber ?? ''));
            tr.appendChild(td(it.barcode ?? ''));
            tr.appendChild(td(String(it.quantity)));
            tr.appendChild(td(it.location ?? ''));
            tr.appendChild(td(it.status ?? ''));
            
            const assignedCell = await createAssignedPersonCell(it);
            tr.appendChild(assignedCell);
            
            tr.appendChild(td((it.tags ?? []).join(', ')));
            tr.appendChild(td(it.notes ?? ''));
            tr.appendChild(td(new Date(it.updatedAt).toLocaleString()));
            
            const actions = createEl('td', { style: 'padding:6px;border-top:1px solid #eee' });
            const del = createEl('button', { type: 'button' }, 'Delete');
            del.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete "${it.name}"?`)) return;
                await currentCallbacks?.onDelete(it.id);
            });
            actions.appendChild(del);
            tr.appendChild(actions);
            
            tr.addEventListener('click', () => currentCallbacks?.onRowClick(it.id));
            tbody.appendChild(tr);
        }
    }

    return { render, element: wrapper };
}
