// Refactored Asset Modal - Clean modular structure
import type { InventoryItem, InventorySettings, PrefixCounters } from '../types';
import { createEl, genId, fmtDate } from '../utils';
import { createBarcodeWidget } from './BarcodeWidget';
import { createIconUpload } from './IconUpload';
import { createAssetForm } from './AssetForm';
import { createHistorySection } from './HistorySection';

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
        tabSection.appendChild(historyTab);
        modalBox.appendChild(tabSection);

        // Tab content
        const overviewContent = createEl('div', { class: 'tab-content active' });
        const historyContent = createHistorySection(existing);

        // Tab switching
        overviewTab.addEventListener('click', () => {
            overviewTab.classList.add('active');
            historyTab.classList.remove('active');
            overviewContent.style.display = 'block';
            historyContent.style.display = 'none';
        });

        historyTab.addEventListener('click', () => {
            overviewTab.classList.remove('active');
            historyTab.classList.add('active');
            overviewContent.style.display = 'none';
            historyContent.style.display = 'block';
        });

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
        modalBox.appendChild(historyContent);

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

                const newQuantity = Number(formFields.quantityField.value) || existing.quantity;
                if (newQuantity !== existing.quantity) changes.push({ field: 'Quantity', oldValue: String(existing.quantity), newValue: String(newQuantity) });

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
                    existing.quantity = newQuantity;
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
                    quantity: Number(formFields.quantityField.value) || 1,
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
