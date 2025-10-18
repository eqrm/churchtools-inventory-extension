// Refactored Asset Modal - Clean modular structure
import type { InventoryItem, InventorySettings, PrefixCounters } from '../types';
import { createEl, genId, fmtDate } from '../utils';
import { createBarcodeWidget } from './BarcodeWidget';
import { createIconUpload } from './IconUpload';
import { createAssetForm } from './AssetForm';
import { createHistorySection } from './HistorySection';
import { nextAssetId } from '../services/assetId.service';

export interface AssetModalCallbacks {
    onSave: (item: InventoryItem, isNew: boolean) => Promise<void>;
    onClose: () => void;
}

export function createAssetModal(
    container: HTMLElement,
    items: InventoryItem[],
    settings: InventorySettings,
    prefixCounters: PrefixCounters,
    currentUserName: string
) {
    const modal = createEl('div', { class: 'ct-asset-modal' });
    const modalBox = createEl('div', { class: 'box' });
    modal.appendChild(modalBox);
    container.appendChild(modal);

    function closeModal() {
        modal.classList.remove('open');
        document.removeEventListener('keydown', onKeyDown);
        setTimeout(() => {
            if (!modal.classList.contains('open')) modal.style.display = 'none';
        }, 220);
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') closeModal();
    }

    modal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === modal) closeModal();
    });

    async function open(internalId?: string, callbacks?: AssetModalCallbacks) {
        const existing = internalId ? items.find(i => i.id === internalId) : undefined;
        
        modal.classList.add('open');
        modal.style.display = 'flex';
        document.addEventListener('keydown', onKeyDown);
        modalBox.innerHTML = '';

        // Close button
        const xBtn = createEl('button', { class: 'modal-close', type: 'button' }, '✕');
        xBtn.addEventListener('click', closeModal);
        modalBox.appendChild(xBtn);

        // Action buttons
        const headerActions = createEl('div', { class: 'asset-modal-actions' });
        const saveBtn = createEl('button', { type: 'button', class: 'btn-primary' }, existing ? 'Save Changes' : 'Create Asset');
        const cancelBtn = createEl('button', { type: 'button', class: 'btn-secondary' }, 'Cancel');
        headerActions.appendChild(cancelBtn);
        
        // Add "Create Instance" button for existing items (to create child copies)
        if (existing) {
            const createInstanceBtn = createEl('button', { 
                type: 'button', 
                class: 'btn-secondary',
                style: 'background:#2196f3;color:white;border-color:#2196f3'
            }, '📦 Create Instance');
            headerActions.appendChild(createInstanceBtn);
            
            createInstanceBtn.addEventListener('click', () => {
                const count = prompt('How many instances of this asset do you want to create?\n\nEach will be a copy with unique Asset ID, Barcode, Serial Number, Status, Assigned To, and Notes.\n\nShared properties (Name, Manufacturer, Model, Icon) will be inherited from this parent.', '1');
                if (!count) return;
                
                const numItems = parseInt(count);
                if (isNaN(numItems) || numItems < 1 || numItems > 1000) {
                    alert('Please enter a number between 1 and 1000');
                    return;
                }
                
                processCreateInstances(numItems);
            });
        }
        
        headerActions.appendChild(saveBtn);
        modalBox.appendChild(headerActions);

        cancelBtn.addEventListener('click', () => {
            closeModal();
            callbacks?.onClose();
        });

        // Header with icon and name
        const header = createEl('div', { class: 'asset-modal-header' });
        const iconUpload = createIconUpload(existing?.assetIcon);
        const headerInfo = createEl('div', { class: 'asset-header-info' });
        
        // Show parent asset link if this is an instance
        if (existing?.parentAssetId) {
            const parentAsset = items.find(i => i.id === existing.parentAssetId);
            if (parentAsset) {
                const parentLink = createEl('div', { 
                    class: 'parent-asset-link',
                    style: 'font-size:12px;color:#666;margin-bottom:4px;cursor:pointer;display:flex;align-items:center;gap:4px'
                });
                parentLink.innerHTML = `<span style="color:#2196f3">🔗 Instance of:</span> <strong style="color:#2196f3">${parentAsset.name}</strong> <span style="color:#999">(ID: ${parentAsset.assetId || parentAsset.id.substring(0, 8)})</span>`;
                parentLink.addEventListener('click', () => {
                    closeModal();
                    // Re-open modal with parent asset
                    setTimeout(() => open(parentAsset.id, callbacks), 100);
                });
                headerInfo.appendChild(parentLink);
            }
        }
        
        // Show instance count if this asset has children
        const childCount = items.filter(i => i.parentAssetId === existing?.id).length;
        if (childCount > 0) {
            const instanceBadge = createEl('div', {
                style: 'font-size:12px;background:#e3f2fd;color:#1976d2;padding:4px 8px;border-radius:12px;display:inline-block;margin-bottom:4px;font-weight:600'
            }, `📦 ${childCount} instance${childCount !== 1 ? 's' : ''}`);
            headerInfo.appendChild(instanceBadge);
        }
        
        const nameInput = createEl('input', {
            type: 'text',
            class: 'asset-name-input',
            placeholder: 'Asset Name',
            value: existing?.name || ''
        }) as HTMLInputElement;
        headerInfo.appendChild(nameInput);

        // Asset ID display
        let tempAssetId = existing?.assetId;
        const assetIdLine = createEl('div', { class: 'asset-id-display' }, `ID: ${tempAssetId ?? '(none)'}`);
        headerInfo.appendChild(assetIdLine);

        // Barcode widget (positioned to the right of header)
        const barcodeWidget = createBarcodeWidget(existing?.barcode || '', items, existing);

        header.appendChild(iconUpload.element);
        header.appendChild(headerInfo);
        header.appendChild(barcodeWidget.element);
        modalBox.appendChild(header);

        // Tabs
        const tabSection = createEl('div', { class: 'asset-tabs' });
        const overviewTab = createEl('div', { class: 'asset-tab active' }, '📋 Overview');
        const historyTab = createEl('div', { class: 'asset-tab' }, '📜 History');
        tabSection.appendChild(overviewTab);
        
        // Add Instances tab if this asset has children
        let instancesTab: HTMLElement | null = null;
        if (existing && childCount > 0) {
            instancesTab = createEl('div', { class: 'asset-tab' }, `📦 Instances (${childCount})`);
            tabSection.appendChild(instancesTab);
        }
        
        tabSection.appendChild(historyTab);
        modalBox.appendChild(tabSection);

        // Tab content
        const overviewContent = createEl('div', { class: 'tab-content active' });
        const historyContent = createHistorySection(existing);
        
        // Instances tab content
        let instancesContent: HTMLElement | null = null;
        if (existing && childCount > 0) {
            instancesContent = createEl('div', { class: 'tab-content', style: 'display:none' });
            const childAssets = items.filter(i => i.parentAssetId === existing.id);
            
            const instancesTitle = createEl('h3', { style: 'margin-bottom:16px' }, 'Child Instances');
            instancesContent.appendChild(instancesTitle);
            
            const instancesTable = createEl('table', { 
                style: 'width:100%;border-collapse:collapse',
                border: '1'
            });
            const thead = createEl('thead');
            const headerRow = createEl('tr');
            ['Asset ID', 'Barcode', 'Serial Number', 'Status', 'Assigned To', 'Notes', 'Actions'].forEach(label => {
                const th = createEl('th', { style: 'padding:8px;text-align:left;background:#f5f5f5' }, label);
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            instancesTable.appendChild(thead);
            
            const tbody = createEl('tbody');
            childAssets.forEach(child => {
                const row = createEl('tr', { style: 'cursor:pointer' });
                const td = (text: string) => createEl('td', { style: 'padding:8px;border-top:1px solid #eee' }, text);
                
                row.appendChild(td(child.assetId || '-'));
                row.appendChild(td(child.barcode || '-'));
                row.appendChild(td(child.serialNumber || '-'));
                row.appendChild(td(child.status || '-'));
                row.appendChild(td(child.assignedToPersonName || '-'));
                row.appendChild(td(child.notes || '-'));
                
                const actionsCell = createEl('td', { style: 'padding:8px;border-top:1px solid #eee' });
                const openBtn = createEl('button', { 
                    type: 'button',
                    style: 'padding:4px 8px;font-size:12px'
                }, 'Open');
                openBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeModal();
                    setTimeout(() => open(child.id, callbacks), 100);
                });
                actionsCell.appendChild(openBtn);
                row.appendChild(actionsCell);
                
                row.addEventListener('click', () => {
                    closeModal();
                    setTimeout(() => open(child.id, callbacks), 100);
                });
                
                tbody.appendChild(row);
            });
            instancesTable.appendChild(tbody);
            instancesContent.appendChild(instancesTable);
        }

        // Tab switching
        const tabs = [overviewTab, historyTab, instancesTab].filter(Boolean) as HTMLElement[];
        const tabContents = [overviewContent, historyContent, instancesContent].filter(Boolean) as HTMLElement[];
        
        const switchToTab = (index: number) => {
            tabs.forEach((tab, i) => {
                if (i === index) {
                    tab.classList.add('active');
                    tabContents[i].style.display = 'block';
                } else {
                    tab.classList.remove('active');
                    tabContents[i].style.display = 'none';
                }
            });
        };
        
        overviewTab.addEventListener('click', () => switchToTab(0));
        historyTab.addEventListener('click', () => switchToTab(instancesTab ? 2 : 1));
        if (instancesTab) {
            instancesTab.addEventListener('click', () => switchToTab(1));
        }

        // Create form
        const formFields = createAssetForm(
            settings,
            items,
            prefixCounters,
            existing,
            (newAssetId) => {
                tempAssetId = newAssetId;
                assetIdLine.textContent = `ID: ${tempAssetId}`;
            }
        );

        overviewContent.appendChild(formFields.form);
        modalBox.appendChild(overviewContent);
        if (instancesContent) modalBox.appendChild(instancesContent);
        modalBox.appendChild(historyContent);

        // Create instances logic - creates child copies of the current asset
        async function processCreateInstances(count: number) {
            if (!existing) {
                alert('Cannot create instances without a parent asset');
                return;
            }
            
            const now = fmtDate();
            const createdItems: InventoryItem[] = [];
            
            for (let i = 0; i < count; i++) {
                // Generate unique ID and assetId for each instance
                const itemId = genId();
                const selectedPrefix = existing.assetId?.match(/^([A-Z]+)/)?.[1] || '';
                const assetId = selectedPrefix ? await nextAssetId(selectedPrefix, items, prefixCounters) : undefined;
                
                const newInstance: InventoryItem = {
                    id: itemId,
                    assetId,
                    barcode: undefined, // Each instance needs unique barcode
                    
                    // Link to parent
                    parentAssetId: existing.id,
                    
                    // Inherited properties from parent (shared)
                    name: existing.name,
                    manufacturer: existing.manufacturer,
                    model: existing.model,
                    assetIcon: existing.assetIcon,
                    location: existing.location, // Can be overridden per instance
                    tags: existing.tags,
                    
                    // Instance-specific properties (unique per item)
                    serialNumber: undefined,
                    status: undefined, // Each instance can have different status
                    assignedToPersonId: undefined,
                    assignedToPersonName: undefined,
                    notes: undefined,
                    
                    // Metadata
                    createdBy: currentUserName,
                    createdAt: now,
                    updatedBy: currentUserName,
                    updatedAt: now,
                    history: [{
                        timestamp: now,
                        user: currentUserName,
                        action: `Created as instance of "${existing.name}" (${i + 1}/${count})`,
                        changes: []
                    }]
                };
                
                createdItems.push(newInstance);
            }
            
            // Save all instances
            for (const item of createdItems) {
                await callbacks?.onSave(item, true);
            }
            
            alert(`Successfully created ${count} instance${count !== 1 ? 's' : ''}!\n\nEach instance:\n• Is linked to the parent asset "${existing.name}"\n• Has a unique Asset ID\n• Needs its own barcode, serial number, status, etc.`);
            closeModal();
        }

        // Save logic
        async function processSave() {
            const now = fmtDate();
            const barcode = barcodeWidget.getValue().trim();

            // Validate barcode for duplicates
            if (barcode) {
                const duplicate = items.find(item => 
                    item.barcode === barcode && item.id !== existing?.id
                );
                if (duplicate) {
                    alert(`Cannot save: Barcode "${barcode}" is already used by "${duplicate.name}".`);
                    return;
                }
            }

            const iconDataUrl = iconUpload.getIconDataUrl();
            const assignedPersonId = formFields.personSearcher.getPersonId();
            let finalStatus = formFields.statusSelector.getValue();

            // Auto-adjust status based on person assignment
            if (assignedPersonId && finalStatus === 'Available') {
                finalStatus = 'Assigned to Person';
            } else if (!assignedPersonId && finalStatus === 'Assigned to Person') {
                finalStatus = 'Available';
            }

            if (existing) {
                // Update existing item
                const changes: { field: string; oldValue?: string; newValue?: string }[] = [];
                
                const newName = nameInput.value.trim() || existing.name;
                if (newName !== existing.name) changes.push({ field: 'Name', oldValue: existing.name, newValue: newName });

                const newManufacturer = formFields.manufacturerSearcher.getValue() || undefined;
                if (newManufacturer !== existing.manufacturer) changes.push({ field: 'Manufacturer', oldValue: existing.manufacturer, newValue: newManufacturer });

                const newModel = formFields.modelSearcher.getValue() || undefined;
                if (newModel !== existing.model) changes.push({ field: 'Model', oldValue: existing.model, newValue: newModel });

                const newSerialNumber = formFields.serialNumberField.value.trim() || undefined;
                if (newSerialNumber !== existing.serialNumber) changes.push({ field: 'Serial Number', oldValue: existing.serialNumber, newValue: newSerialNumber });

                const newBarcode = barcode || undefined;
                if (newBarcode !== existing.barcode) changes.push({ field: 'Barcode', oldValue: existing.barcode, newValue: newBarcode });

                const newLocation = formFields.locationSearcher.getValue() || undefined;
                if (newLocation !== existing.location) changes.push({ field: 'Location', oldValue: existing.location, newValue: newLocation });

                if (finalStatus !== existing.status) changes.push({ field: 'Status', oldValue: existing.status, newValue: finalStatus });

                const newAssignedName = formFields.personSearcher.getPersonName() || undefined;
                if (newAssignedName !== existing.assignedToPersonName) changes.push({ field: 'Assigned To', oldValue: existing.assignedToPersonName, newValue: newAssignedName });

                const newNotes = formFields.notesField.value.trim() || undefined;
                if (newNotes !== existing.notes) changes.push({ field: 'Notes', oldValue: existing.notes, newValue: newNotes });

                if (changes.length > 0 || iconDataUrl !== existing.assetIcon) {
                    existing.assetIcon = iconDataUrl;
                    existing.name = newName;
                    existing.barcode = newBarcode;
                    existing.manufacturer = newManufacturer;
                    existing.model = newModel;
                    existing.serialNumber = newSerialNumber;
                    existing.location = newLocation;
                    existing.status = finalStatus;
                    existing.assignedToPersonId = assignedPersonId;
                    existing.assignedToPersonName = newAssignedName;
                    existing.notes = newNotes;
                    existing.tags = formFields.tagsField.value.split(',').map(s => s.trim()).filter(Boolean) || undefined;
                    existing.updatedBy = currentUserName;
                    existing.updatedAt = now;

                    if (!existing.history) existing.history = [];
                    existing.history.unshift({
                        timestamp: now,
                        user: currentUserName,
                        action: 'Updated asset',
                        changes
                    });

                    await callbacks?.onSave(existing, false);
                }
            } else {
                // Create new item
                const newItem: InventoryItem = {
                    id: genId(),
                    assetId: tempAssetId,
                    barcode: barcode || undefined,
                    assetIcon: iconDataUrl,
                    name: nameInput.value.trim() || 'New Asset',
                    manufacturer: formFields.manufacturerSearcher.getValue() || undefined,
                    model: formFields.modelSearcher.getValue() || undefined,
                    serialNumber: formFields.serialNumberField.value.trim() || undefined,
                    location: formFields.locationSearcher.getValue() || undefined,
                    status: finalStatus,
                    assignedToPersonId: assignedPersonId,
                    assignedToPersonName: formFields.personSearcher.getPersonName() || undefined,
                    notes: formFields.notesField.value.trim() || undefined,
                    tags: formFields.tagsField.value.split(',').map(s => s.trim()).filter(Boolean) || undefined,
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

                await callbacks?.onSave(newItem, true);
            }

            closeModal();
        }

        saveBtn.addEventListener('click', () => processSave());
        formFields.form.addEventListener('submit', (ev) => {
            ev.preventDefault();
            processSave();
        });
    }

    return { open, close: closeModal };
}
