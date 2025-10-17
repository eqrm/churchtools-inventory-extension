// Batch scanning functionality for updating multiple items
import type { InventoryItem, InventorySettings } from '../types';
import { createEl } from '../utils';
import { createMasterdataSearcher } from '../components/MasterdataSearcher';
import { createPersonSearcher } from '../components/PersonSearcher';

export interface BatchScanCallbacks {
    onBatchUpdate: (updates: BatchUpdate[]) => Promise<void>;
    onClose: () => void;
}

export interface BatchUpdate {
    itemId: string;
    item: InventoryItem;
    updates: {
        location?: string;
        status?: string;
        assignedToPersonId?: number;
        assignedToPersonName?: string;
    };
}

type ScanMode = 'text' | 'camera';
type UpdateField = 'location' | 'status' | 'assignedTo';

export function createBatchScanModal(container: HTMLElement) {
    const modal = createEl('div', { class: 'ct-asset-modal' });
    const modalBox = createEl('div', { class: 'box', style: 'max-width:600px' });
    modal.appendChild(modalBox);
    container.appendChild(modal);

    function closeModal() {
        stopCamera();
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

    let stream: MediaStream | null = null;
    let scanning = false;
    const supportsBarcode = typeof (window as any).BarcodeDetector !== 'undefined';

    function stopCamera() {
        scanning = false;
        if (stream) {
            for (const t of stream.getTracks()) t.stop();
            stream = null;
        }
    }

    async function open(
        items: InventoryItem[],
        settings: InventorySettings,
        callbacks?: BatchScanCallbacks
    ) {
        modalBox.innerHTML = '';
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('open'));
        document.addEventListener('keydown', onKeyDown);

        const scannedItems: Map<string, InventoryItem> = new Map();
        let scanMode: ScanMode = 'text';
        let selectedFields: Set<UpdateField> = new Set();
        
        // Initialize masterdata if needed
        if (!settings.masterdata) {
            settings.masterdata = {
                manufacturers: [],
                locations: [],
                models: []
            };
        }

        // Header
        const xBtn = createEl('button', { 
            type: 'button', 
            class: 'modal-close-btn', 
            'aria-label': 'Close' 
        }, '✕');
        xBtn.addEventListener('click', () => {
            closeModal();
            callbacks?.onClose();
        });
        modalBox.appendChild(xBtn);

        const title = createEl('h2', {}, '🔍 Batch Scan Mode');
        modalBox.appendChild(title);

        const description = createEl('p', { 
            style: 'color:#666;margin:8px 0' 
        }, 'Select fields to update, then scan items to apply changes in bulk.');
        modalBox.appendChild(description);

        // Field selection
        const fieldsSection = createEl('div', { style: 'margin:16px 0;padding:12px;background:#f5f5f5;border-radius:4px' });
        const fieldsTitle = createEl('h3', { style: 'margin:0 0 8px 0' }, 'Fields to Update');
        fieldsSection.appendChild(fieldsTitle);

        const fieldCheckboxes = createEl('div', { style: 'display:flex;flex-direction:column;gap:8px' });
        
        const locationCheck = createEl('input', { type: 'checkbox', id: 'batch-location' }) as HTMLInputElement;
        const locationLabel = createEl('label', { for: 'batch-location', style: 'cursor:pointer' }, '📍 Location');
        const locationRow = createEl('div', { style: 'display:flex;align-items:center;gap:8px' });
        locationRow.appendChild(locationCheck);
        locationRow.appendChild(locationLabel);
        
        const statusCheck = createEl('input', { type: 'checkbox', id: 'batch-status' }) as HTMLInputElement;
        const statusLabel = createEl('label', { for: 'batch-status', style: 'cursor:pointer' }, '📊 Status');
        const statusRow = createEl('div', { style: 'display:flex;align-items:center;gap:8px' });
        statusRow.appendChild(statusCheck);
        statusRow.appendChild(statusLabel);
        
        const assignedCheck = createEl('input', { type: 'checkbox', id: 'batch-assigned' }) as HTMLInputElement;
        const assignedLabel = createEl('label', { for: 'batch-assigned', style: 'cursor:pointer' }, '👤 Assigned Person');
        const assignedRow = createEl('div', { style: 'display:flex;align-items:center;gap:8px' });
        assignedRow.appendChild(assignedCheck);
        assignedRow.appendChild(assignedLabel);
        
        fieldCheckboxes.appendChild(locationRow);
        fieldCheckboxes.appendChild(statusRow);
        fieldCheckboxes.appendChild(assignedRow);
        fieldsSection.appendChild(fieldCheckboxes);
        modalBox.appendChild(fieldsSection);

        // Value inputs (shown when checkboxes are selected)
        const valuesSection = createEl('div', { style: 'margin:16px 0' });
        modalBox.appendChild(valuesSection);

        let locationSearcher: ReturnType<typeof createMasterdataSearcher> | null = null;
        let statusSelect: HTMLSelectElement | null = null;
        let personSearcher: ReturnType<typeof createPersonSearcher> | null = null;

        const renderValueInputs = () => {
            valuesSection.innerHTML = '';
            selectedFields.clear();

            if (locationCheck.checked) {
                selectedFields.add('location');
                const label = createEl('label', { style: 'display:block;margin:8px 0;font-weight:500' }, 'New Location:');
                valuesSection.appendChild(label);
                
                locationSearcher = createMasterdataSearcher(
                    'locations',
                    settings.masterdata!.locations,
                    undefined,
                    async (name) => {
                        const newItem = {
                            id: `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        settings.masterdata!.locations.push(newItem);
                        // Note: Settings will be saved when batch update is applied
                    }
                );
                valuesSection.appendChild(locationSearcher.wrapper);
            }

            if (statusCheck.checked) {
                selectedFields.add('status');
                const label = createEl('label', { style: 'display:block;margin:8px 0;font-weight:500' }, 'New Status:');
                valuesSection.appendChild(label);
                
                statusSelect = createEl('select', { style: 'width:100%;padding:8px' }) as HTMLSelectElement;
                const statuses = ['Available', 'Broken', 'In Repair', 'Sold', 'Scrapped', 'Assigned to Person', 'Installed'];
                statuses.forEach(status => {
                    const option = createEl('option', { value: status }, status);
                    statusSelect!.appendChild(option);
                });
                valuesSection.appendChild(statusSelect);
            }

            if (assignedCheck.checked) {
                selectedFields.add('assignedTo');
                const label = createEl('label', { style: 'display:block;margin:8px 0;font-weight:500' }, 'Assign To Person:');
                valuesSection.appendChild(label);
                
                personSearcher = createPersonSearcher();
                valuesSection.appendChild(personSearcher.wrapper);
            }
        };

        locationCheck.addEventListener('change', renderValueInputs);
        statusCheck.addEventListener('change', renderValueInputs);
        assignedCheck.addEventListener('change', renderValueInputs);

        // Scan mode toggle
        const scanModeSection = createEl('div', { 
            style: 'margin:16px 0;display:flex;gap:8px;align-items:center' 
        });
        const scanModeLabel = createEl('span', { style: 'font-weight:500' }, 'Scan Mode:');
        const textModeBtn = createEl('button', { 
            type: 'button',
            class: 'btn-primary',
            style: 'padding:6px 12px'
        }, '⌨️ Text Input');
        const cameraModeBtn = createEl('button', { 
            type: 'button',
            style: 'padding:6px 12px'
        }, '📷 Camera');
        
        scanModeSection.appendChild(scanModeLabel);
        scanModeSection.appendChild(textModeBtn);
        scanModeSection.appendChild(cameraModeBtn);
        modalBox.appendChild(scanModeSection);

        const updateScanModeButtons = () => {
            if (scanMode === 'text') {
                textModeBtn.classList.add('btn-primary');
                cameraModeBtn.classList.remove('btn-primary');
            } else {
                textModeBtn.classList.remove('btn-primary');
                cameraModeBtn.classList.add('btn-primary');
            }
        };

        textModeBtn.addEventListener('click', () => {
            scanMode = 'text';
            stopCamera();
            updateScanModeButtons();
            renderScanArea();
        });

        cameraModeBtn.addEventListener('click', () => {
            scanMode = 'camera';
            updateScanModeButtons();
            renderScanArea();
        });

        // Scan area
        const scanAreaContainer = createEl('div', { style: 'margin:16px 0' });
        modalBox.appendChild(scanAreaContainer);

        const renderScanArea = () => {
            scanAreaContainer.innerHTML = '';
            stopCamera();

            if (scanMode === 'text') {
                const inputRow = createEl('div', { style: 'display:flex;gap:8px' });
                const codeInput = createEl('input', { 
                    placeholder: 'Scan or enter code (Asset ID, QR code, etc.)',
                    style: 'flex:1;padding:8px'
                }) as HTMLInputElement;
                const scanBtn = createEl('button', { 
                    type: 'button',
                    class: 'btn-primary'
                }, '➕ Add');
                
                const handleScan = () => {
                    const code = codeInput.value.trim();
                    if (!code) return;
                    
                    const foundItem = items.find(i => 
                        i.id === code || 
                        i.assetId === code || 
                        (i.tags ?? []).includes(code) ||
                        i.name === code
                    );
                    
                    if (foundItem && !scannedItems.has(foundItem.id)) {
                        scannedItems.set(foundItem.id, foundItem);
                        renderScannedList();
                        codeInput.value = '';
                        codeInput.focus();
                    } else if (foundItem) {
                        alert('Item already scanned');
                        codeInput.value = '';
                    } else {
                        alert(`No item found for code: ${code}`);
                    }
                };
                
                scanBtn.addEventListener('click', handleScan);
                codeInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScan();
                    }
                });
                
                inputRow.appendChild(codeInput);
                inputRow.appendChild(scanBtn);
                scanAreaContainer.appendChild(inputRow);
                
                setTimeout(() => codeInput.focus(), 100);
                
            } else {
                // Camera mode
                const videoEl = createEl('video', { 
                    autoplay: 'true', 
                    playsinline: 'true',
                    style: 'width:100%;max-width:400px;border:1px solid #ddd;border-radius:4px;margin:8px 0'
                }) as HTMLVideoElement;
                
                const canvasEl = createEl('canvas', { style: 'display:none' }) as HTMLCanvasElement;
                const statusText = createEl('div', { 
                    style: 'text-align:center;color:#666;margin:8px 0' 
                }, 'Initializing camera...');
                
                scanAreaContainer.appendChild(statusText);
                scanAreaContainer.appendChild(videoEl);
                scanAreaContainer.appendChild(canvasEl);
                
                startCameraScan(videoEl, canvasEl, statusText);
            }
        };

        const startCameraScan = async (
            videoEl: HTMLVideoElement, 
            _canvasEl: HTMLCanvasElement,
            statusText: HTMLElement
        ) => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                videoEl.srcObject = stream;
                scanning = true;
                statusText.textContent = 'Scanning... Point at QR code or barcode';
                
                const detector = supportsBarcode ? 
                    new (window as any).BarcodeDetector({ 
                        formats: ['qr_code', 'ean_13', 'code_128', 'code_39'] 
                    }) : null;
                
                if (!detector) {
                    statusText.textContent = 'Barcode detection not supported in this browser. Use text mode.';
                    statusText.style.color = '#f00';
                    return;
                }
                
                const loop = async () => {
                    if (!scanning) return;
                    try {
                        const barcodes = await detector.detect(videoEl as unknown as ImageBitmapSource);
                        if (barcodes && barcodes.length) {
                            const code = String(barcodes[0].rawValue);
                            
                            const foundItem = items.find(i => 
                                i.id === code || 
                                i.assetId === code || 
                                (i.tags ?? []).includes(code) ||
                                i.name === code
                            );
                            
                            if (foundItem && !scannedItems.has(foundItem.id)) {
                                scannedItems.set(foundItem.id, foundItem);
                                renderScannedList();
                                statusText.textContent = `✓ Added: ${foundItem.name}`;
                                statusText.style.color = '#4caf50';
                                
                                // Reset status after 1 second
                                setTimeout(() => {
                                    if (scanning) {
                                        statusText.textContent = 'Scanning... Point at QR code or barcode';
                                        statusText.style.color = '#666';
                                    }
                                }, 1000);
                            } else if (foundItem) {
                                statusText.textContent = `⚠ Already scanned: ${foundItem.name}`;
                                statusText.style.color = '#ff9800';
                                setTimeout(() => {
                                    if (scanning) {
                                        statusText.textContent = 'Scanning... Point at QR code or barcode';
                                        statusText.style.color = '#666';
                                    }
                                }, 1000);
                            }
                        }
                    } catch (e) {
                        console.error('Scan loop error', e);
                    }
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            } catch (e) {
                statusText.textContent = 'Camera access failed or denied. Use text mode.';
                statusText.style.color = '#f00';
                console.error(e);
            }
        };

        // Scanned items list
        const scannedListSection = createEl('div', { style: 'margin:16px 0' });
        modalBox.appendChild(scannedListSection);

        const renderScannedList = () => {
            scannedListSection.innerHTML = '';
            
            const header = createEl('h3', {}, `Scanned Items (${scannedItems.size})`);
            scannedListSection.appendChild(header);
            
            if (scannedItems.size === 0) {
                const empty = createEl('div', { 
                    style: 'color:#999;font-style:italic;padding:12px;text-align:center' 
                }, 'No items scanned yet');
                scannedListSection.appendChild(empty);
                return;
            }
            
            const list = createEl('div', { 
                style: 'max-height:200px;overflow-y:auto;border:1px solid #ddd;border-radius:4px;padding:8px' 
            });
            
            scannedItems.forEach((item, itemId) => {
                const row = createEl('div', { 
                    style: 'display:flex;justify-content:space-between;align-items:center;padding:6px;background:#f9f9f9;margin:4px 0;border-radius:4px' 
                });
                
                const itemInfo = createEl('div', {});
                const itemName = createEl('div', { style: 'font-weight:500' }, item.name);
                const itemMeta = createEl('div', { 
                    style: 'font-size:11px;color:#666' 
                }, `ID: ${item.assetId || item.id}`);
                itemInfo.appendChild(itemName);
                itemInfo.appendChild(itemMeta);
                
                const removeBtn = createEl('button', { 
                    type: 'button',
                    style: 'padding:4px 8px;background:#ffebee;border:1px solid #ef5350;border-radius:4px;cursor:pointer'
                }, '✕');
                removeBtn.addEventListener('click', () => {
                    scannedItems.delete(itemId);
                    renderScannedList();
                });
                
                row.appendChild(itemInfo);
                row.appendChild(removeBtn);
                list.appendChild(row);
            });
            
            scannedListSection.appendChild(list);
        };

        renderScannedList();

        // Action buttons
        const actions = createEl('div', { 
            style: 'margin-top:24px;display:flex;gap:8px;justify-content:flex-end' 
        });
        
        const cancelBtn = createEl('button', { 
            type: 'button',
            class: 'btn-secondary'
        }, 'Cancel');
        
        const applyBtn = createEl('button', { 
            type: 'button',
            class: 'btn-primary'
        }, '✓ Apply Updates');
        
        actions.appendChild(cancelBtn);
        actions.appendChild(applyBtn);
        modalBox.appendChild(actions);

        cancelBtn.addEventListener('click', () => {
            closeModal();
            callbacks?.onClose();
        });

        applyBtn.addEventListener('click', async () => {
            if (scannedItems.size === 0) {
                alert('No items scanned');
                return;
            }
            
            if (selectedFields.size === 0) {
                alert('Please select at least one field to update');
                return;
            }
            
            const updates: BatchUpdate[] = [];
            const updateData: any = {};
            
            if (selectedFields.has('location') && locationSearcher) {
                const location = locationSearcher.getValue();
                if (!location) {
                    alert('Please select a location');
                    return;
                }
                updateData.location = location;
            }
            
            if (selectedFields.has('status') && statusSelect) {
                updateData.status = statusSelect.value;
            }
            
            if (selectedFields.has('assignedTo') && personSearcher) {
                const personId = personSearcher.getPersonId();
                const personName = personSearcher.getPersonName();
                if (!personName) {
                    alert('Please select a person');
                    return;
                }
                updateData.assignedToPersonId = personId;
                updateData.assignedToPersonName = personName;
            }
            
            scannedItems.forEach((item) => {
                updates.push({
                    itemId: item.id,
                    item,
                    updates: updateData
                });
            });
            
            await callbacks?.onBatchUpdate(updates);
            closeModal();
        });

        // Initialize scan area
        renderScanArea();
    }

    return { open, close: closeModal };
}

