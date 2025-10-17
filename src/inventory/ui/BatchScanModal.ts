/**
 * Batch Scan Modal Component
 * Allows batch updating of item properties by scanning multiple items
 */

import type { InventoryItem, InventorySettings } from '../types';
import { createEl } from '../utils';
import { createMasterdataSearcher } from '../components/MasterdataSearcher';
import { createPersonSearcher } from '../components/PersonSearcher';
import { FIXED_STATUSES } from '../constants';
import { saveSettings } from '../services/storage.service';

export interface BatchScanModalCallbacks {
    onUpdate: (items: InventoryItem[]) => Promise<void>;
    onClose: () => void;
}

type UpdateMode = 'location' | 'status' | 'assignedTo';
type InputMode = 'text' | 'camera';

/**
 * Generate Code 128 barcode as SVG
 * Code 128 is a high-density barcode that can encode all 128 ASCII characters
 */
function generateBarcodePattern(text: string): SVGElement {
    const width = 400;
    const height = 80;
    
    // Code 128 encoding patterns (each pattern is 11 modules wide, 6 elements: 3 bars, 3 spaces)
    // Pattern format: [bar, space, bar, space, bar, space] widths (1-4 modules each)
    const CODE128 = [
        [2,1,2,2,2,2], [2,2,2,1,2,2], [2,2,2,2,2,1], [1,2,1,2,2,3], [1,2,1,3,2,2],
        [1,3,1,2,2,2], [1,2,2,2,1,3], [1,2,2,3,1,2], [1,3,2,2,1,2], [2,2,1,2,1,3],
        [2,2,1,3,1,2], [2,3,1,2,1,2], [1,1,2,2,3,2], [1,2,2,1,3,2], [1,2,2,2,3,1],
        [1,1,3,2,2,2], [1,2,3,1,2,2], [1,2,3,2,2,1], [2,2,3,2,1,1], [2,2,1,1,3,2],
        [2,2,1,2,3,1], [2,1,3,2,1,2], [2,2,3,1,1,2], [3,1,2,1,3,1], [3,1,1,2,2,2],
        [3,2,1,1,2,2], [3,2,1,2,2,1], [3,1,2,2,1,2], [3,2,2,1,1,2], [3,2,2,2,1,1],
        [2,1,2,1,2,3], [2,1,2,3,2,1], [2,3,2,1,2,1], [1,1,1,3,2,3], [1,3,1,1,2,3],
        [1,3,1,3,2,1], [1,1,2,3,1,3], [1,3,2,1,1,3], [1,3,2,3,1,1], [2,1,1,3,1,3],
        [2,3,1,1,1,3], [2,3,1,3,1,1], [1,1,2,1,3,3], [1,1,2,3,3,1], [1,3,2,1,3,1],
        [1,1,3,1,2,3], [1,1,3,3,2,1], [1,3,3,1,2,1], [3,1,3,1,2,1], [2,1,1,3,3,1],
        [2,3,1,1,3,1], [2,1,3,1,1,3], [2,1,3,3,1,1], [2,1,3,1,3,1], [3,1,1,1,2,3],
        [3,1,1,3,2,1], [3,3,1,1,2,1], [3,1,2,1,1,3], [3,1,2,3,1,1], [3,3,2,1,1,1],
        [3,1,4,1,1,1], [2,2,1,4,1,1], [4,3,1,1,1,1], [1,1,1,2,2,4], [1,1,1,4,2,2],
        [1,2,1,1,2,4], [1,2,1,4,2,1], [1,4,1,1,2,2], [1,4,1,2,2,1], [1,1,2,2,1,4],
        [1,1,2,4,1,2], [1,2,2,1,1,4], [1,2,2,4,1,1], [1,4,2,1,1,2], [1,4,2,2,1,1],
        [2,4,1,2,1,1], [2,2,1,1,1,4], [4,1,3,1,1,1], [2,4,1,1,1,2], [1,3,4,1,1,1],
        [1,1,1,2,4,2], [1,2,1,1,4,2], [1,2,1,2,4,1], [1,1,4,2,1,2], [1,2,4,1,1,2],
        [1,2,4,2,1,1], [4,1,1,2,1,2], [4,2,1,1,1,2], [4,2,1,2,1,1], [2,1,2,1,4,1],
        [2,1,4,1,2,1], [4,1,2,1,2,1], [1,1,1,1,4,3], [1,1,1,3,4,1], [1,3,1,1,4,1],
        [1,1,4,1,1,3], [1,1,4,3,1,1], [4,1,1,1,1,3], [4,1,1,3,1,1], [1,1,3,1,4,1],
        [1,1,4,1,3,1], [3,1,1,1,4,1], [4,1,1,1,3,1], [2,1,1,4,1,2], [2,1,1,2,1,4],
        [2,1,1,2,3,2], [2,3,3,1,1,1,2] // Stop pattern
    ];
    
    const START_B = 104; // Start Code B (for ASCII 32-127)
    const STOP = 106;
    
    // Convert text to Code 128B values
    const values: number[] = [START_B];
    let checksum = START_B;
    
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        // Code 128B: space (32) = 0, ! (33) = 1, ... ~ (126) = 94
        const value = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
        values.push(value);
        checksum += value * (i + 1);
    }
    
    // Add checksum
    values.push(checksum % 103);
    values.push(STOP);
    
    // Generate SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.style.display = 'block';
    svg.style.background = 'white';
    
    // Calculate module width to fit the barcode
    const totalModules = values.length * 11 + 2; // +2 for quiet zones
    const moduleWidth = width / totalModules;
    
    let x = moduleWidth * 2; // Left quiet zone
    
    // Draw each encoded value
    values.forEach(value => {
        const pattern = CODE128[value];
        for (let i = 0; i < pattern.length; i++) {
            const elementWidth = pattern[i] * moduleWidth;
            if (i % 2 === 0) { // Bars (even indices)
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', String(x));
                rect.setAttribute('y', '5');
                rect.setAttribute('width', String(elementWidth));
                rect.setAttribute('height', String(height - 10));
                rect.setAttribute('fill', '#000');
                svg.appendChild(rect);
            }
            x += elementWidth;
        }
    });
    
    return svg;
}

export function createBatchScanModal(
    container: HTMLElement,
    items: InventoryItem[],
    settings: InventorySettings,
    currentUserName: string
) {
    const modal = createEl('div', { class: 'ct-asset-modal' });
    const modalBox = createEl('div', { class: 'box', style: 'max-width: 600px' });
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

    async function open(callbacks?: BatchScanModalCallbacks) {
        modalBox.innerHTML = '';
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('open'));
        document.addEventListener('keydown', onKeyDown);

        // Close button
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

        // Title
        const title = createEl('h2', {}, '📱 Batch Scan Mode');
        modalBox.appendChild(title);

        // State
        let updateMode: UpdateMode = 'location';
        let inputMode: InputMode = 'text';
        let scannedItems: Set<string> = new Set();
        let updateValue: string | number | undefined;
        let showPairingBarcode = false;

        // Initialize masterdata if needed
        if (!settings.masterdata) {
            settings.masterdata = {
                manufacturers: [],
                locations: [],
                models: []
            };
        }

        const contentContainer = createEl('div', { style: 'padding: 16px 0' });
        
        // Create containers that we'll update separately
        let scannedItemsContainer: HTMLDivElement | undefined;
        let applyButton: HTMLButtonElement | undefined;
        
        const updateScannedItemsDisplay = () => {
            if (!scannedItemsContainer) return;
            
            scannedItemsContainer.innerHTML = '';
            
            const scannedLabel = createEl('h3', {}, `Scanned Items (${scannedItems.size}):`);
            scannedItemsContainer.appendChild(scannedLabel);

            if (scannedItems.size === 0) {
                const empty = createEl('div', { 
                    style: 'padding:16px;background:#f9f9f9;border-radius:4px;color:#999;font-style:italic'
                }, 'No items scanned yet. Start scanning to add items.');
                scannedItemsContainer.appendChild(empty);
            } else {
                const itemsList = createEl('div', { style: 'max-height:200px;overflow-y:auto;border:1px solid #ddd;border-radius:4px' });
                
                scannedItems.forEach(itemId => {
                    const item = items.find(i => i.id === itemId);
                    if (!item) return;

                    const itemRow = createEl('div', {
                        style: 'padding:8px 12px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center'
                    });

                    const itemInfo = createEl('div', {});
                    itemInfo.appendChild(createEl('div', { style: 'font-weight:500' }, item.name));
                    itemInfo.appendChild(createEl('div', { style: 'font-size:12px;color:#666' }, `ID: ${item.assetId || item.id}`));
                    itemRow.appendChild(itemInfo);

                    const removeBtn = createEl('button', {
                        type: 'button',
                        style: 'padding:4px 8px;background:#ffebee;border:1px solid #ef5350;border-radius:4px;cursor:pointer'
                    }, '✕');
                    removeBtn.addEventListener('click', () => {
                        scannedItems.delete(itemId);
                        updateScannedItemsDisplay();
                        if (applyButton) {
                            applyButton.disabled = scannedItems.size === 0 || !updateValue;
                            applyButton.textContent = `✓ Update ${scannedItems.size} Item${scannedItems.size !== 1 ? 's' : ''}`;
                        }
                    });
                    itemRow.appendChild(removeBtn);

                    itemsList.appendChild(itemRow);
                });

                scannedItemsContainer.appendChild(itemsList);
            }
            
            // Update apply button text
            if (applyButton) {
                applyButton.disabled = scannedItems.size === 0 || !updateValue;
                applyButton.textContent = `✓ Update ${scannedItems.size} Item${scannedItems.size !== 1 ? 's' : ''}`;
            }
        };
        
        const render = () => {
            contentContainer.innerHTML = '';

            if (showPairingBarcode) {
                // Pairing barcode view
                const pairingSection = createEl('div', { 
                    style: 'display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px'
                });
                
                const pairingTitle = createEl('h3', {}, '🔗 Pair Bluetooth Scanner');
                pairingSection.appendChild(pairingTitle);

                const instruction = createEl('p', { 
                    style: 'text-align:center;color:#666;margin:0 0 16px 0'
                }, 'Scan this barcode with your scanner to enable Bluetooth transmission:');
                pairingSection.appendChild(instruction);

                // Create barcode display using Code 128
                const barcodeText = '$#IFSNO$4 Bluetooth Transmit';
                const barcodeContainer = createEl('div', { 
                    style: 'background:#fff;border:2px solid #333;padding:24px;border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:12px'
                });
                
                // Generate simple barcode representation (Code 128-like pattern)
                // This is a simplified visual representation
                const barcodeSvg = generateBarcodePattern(barcodeText);
                barcodeContainer.appendChild(barcodeSvg);
                
                // Text below barcode
                const barcodeTextDisplay = createEl('div', { 
                    style: 'font-family:monospace;font-size:14px;font-weight:bold;letter-spacing:1px'
                }, barcodeText);
                barcodeContainer.appendChild(barcodeTextDisplay);
                
                pairingSection.appendChild(barcodeContainer);

                const barcodeNote = createEl('div', { 
                    style: 'font-size:12px;color:#999;margin-top:8px;text-align:center'
                }, 'Position your scanner to capture the entire barcode');
                pairingSection.appendChild(barcodeNote);

                const backBtn = createEl('button', { 
                    type: 'button',
                    style: 'margin-top:24px;padding:12px 24px'
                }, '← Back to Scanning');
                backBtn.addEventListener('click', () => {
                    showPairingBarcode = false;
                    render();
                });
                pairingSection.appendChild(backBtn);

                contentContainer.appendChild(pairingSection);
                return;
            }

            // Mode selection
            const modeSection = createEl('div', { style: 'margin-bottom:24px' });
            const modeLabel = createEl('h3', {}, 'Update Property:');
            modeSection.appendChild(modeLabel);

            const modeButtons = createEl('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' });
            
            const modes: Array<{ key: UpdateMode; label: string; icon: string }> = [
                { key: 'location', label: 'Location', icon: '📍' },
                { key: 'status', label: 'Status', icon: '🏷️' },
                { key: 'assignedTo', label: 'Assigned To', icon: '👤' }
            ];

            modes.forEach(({ key, label, icon }) => {
                const btn = createEl('button', {
                    type: 'button',
                    style: `padding:12px 16px;border:2px solid ${updateMode === key ? '#1976d2' : '#ddd'};background:${updateMode === key ? '#e3f2fd' : '#fff'};border-radius:8px;cursor:pointer;font-weight:${updateMode === key ? '600' : '400'}`
                }, `${icon} ${label}`);
                btn.addEventListener('click', () => {
                    updateMode = key;
                    updateValue = undefined;
                    render();
                });
                modeButtons.appendChild(btn);
            });

            modeSection.appendChild(modeButtons);
            contentContainer.appendChild(modeSection);

            // Value selection based on mode
            const valueSection = createEl('div', { style: 'margin-bottom:24px' });
            const valueLabel = createEl('h3', {}, `Select ${updateMode === 'location' ? 'Location' : updateMode === 'status' ? 'Status' : 'Person'}:`);
            valueSection.appendChild(valueLabel);

            if (updateMode === 'location') {
                const locationSearcher = createMasterdataSearcher(
                    'locations',
                    settings.masterdata!.locations,
                    typeof updateValue === 'string' ? updateValue : undefined,
                    async (name) => {
                        const newItem = {
                            id: `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        settings.masterdata!.locations.push(newItem);
                        await saveSettings(settings);
                        // Update the value after creating new item
                        updateValue = name;
                    }
                );
                locationSearcher.input.addEventListener('change', () => {
                    updateValue = locationSearcher.getValue();
                });
                locationSearcher.input.addEventListener('blur', () => {
                    updateValue = locationSearcher.getValue();
                });
                valueSection.appendChild(locationSearcher.wrapper);
            } else if (updateMode === 'status') {
                const statusSelect = createEl('select', { 
                    style: 'width:100%;padding:8px;border:1px solid #ddd;border-radius:4px'
                }) as HTMLSelectElement;
                
                const placeholder = createEl('option', { value: '' }, '-- Select Status --');
                statusSelect.appendChild(placeholder);
                
                FIXED_STATUSES.forEach(status => {
                    const option = createEl('option', { value: status }, status);
                    if (updateValue === status) option.setAttribute('selected', 'true');
                    statusSelect.appendChild(option);
                });
                
                statusSelect.addEventListener('change', () => {
                    updateValue = statusSelect.value;
                });
                
                valueSection.appendChild(statusSelect);
            } else if (updateMode === 'assignedTo') {
                const personSearcher = createPersonSearcher(
                    typeof updateValue === 'number' ? updateValue : undefined,
                    undefined
                );
                
                // Track changes
                let lastPersonId: number | undefined;
                personSearcher.input.addEventListener('input', () => {
                    const currentPersonId = personSearcher.getPersonId();
                    if (currentPersonId !== lastPersonId) {
                        lastPersonId = currentPersonId;
                        updateValue = currentPersonId;
                    }
                });
                
                valueSection.appendChild(personSearcher.wrapper);
            }

            contentContainer.appendChild(valueSection);

            // Input mode toggle
            const inputModeSection = createEl('div', { style: 'margin-bottom:24px' });
            const inputModeLabel = createEl('h3', {}, 'Scan Mode:');
            inputModeSection.appendChild(inputModeLabel);

            const inputModeButtons = createEl('div', { style: 'display:flex;gap:8px' });
            
            const textModeBtn = createEl('button', {
                type: 'button',
                style: `padding:12px 16px;border:2px solid ${inputMode === 'text' ? '#1976d2' : '#ddd'};background:${inputMode === 'text' ? '#e3f2fd' : '#fff'};border-radius:8px;cursor:pointer;flex:1`
            }, '⌨️ Text Input');
            textModeBtn.addEventListener('click', () => {
                inputMode = 'text';
                render();
            });
            inputModeButtons.appendChild(textModeBtn);

            const cameraModeBtn = createEl('button', {
                type: 'button',
                style: `padding:12px 16px;border:2px solid ${inputMode === 'camera' ? '#1976d2' : '#ddd'};background:${inputMode === 'camera' ? '#e3f2fd' : '#fff'};border-radius:8px;cursor:pointer;flex:1`
            }, '📷 Camera');
            cameraModeBtn.addEventListener('click', () => {
                inputMode = 'camera';
                render();
            });
            inputModeButtons.appendChild(cameraModeBtn);

            inputModeSection.appendChild(inputModeButtons);
            contentContainer.appendChild(inputModeSection);

            // Scan input
            const scanSection = createEl('div', { style: 'margin-bottom:24px' });
            
            if (inputMode === 'text') {
                const scanInput = createEl('input', {
                    type: 'text',
                    placeholder: 'Scan barcode / QR code or type Asset ID...',
                    style: 'width:100%;padding:12px;border:2px solid #1976d2;border-radius:8px;font-size:16px'
                }) as HTMLInputElement;

                const handleScan = () => {
                    const code = scanInput.value.trim();
                    if (!code) return;

                    // Find item by barcode, assetId, or internal id
                    const item = items.find(i => 
                        i.barcode === code || 
                        i.assetId === code || 
                        i.id === code
                    );
                    
                    if (item) {
                        scannedItems.add(item.id);
                        scanInput.value = '';
                        // Don't call render() here - just update the scanned items list
                        updateScannedItemsDisplay();
                        scanInput.focus();
                    } else {
                        alert(`Item not found: ${code}`);
                        scanInput.value = '';
                        scanInput.focus();
                    }
                };

                scanInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        handleScan();
                    }
                });

                scanSection.appendChild(scanInput);
                
                // Auto-focus the input
                setTimeout(() => scanInput.focus(), 100);
            } else {
                // Camera mode placeholder
                const cameraPlaceholder = createEl('div', {
                    style: 'padding:48px;background:#f5f5f5;border-radius:8px;text-align:center;color:#666'
                }, '📷 Camera scanning coming soon...\nFor now, please use Text Input mode.');
                scanSection.appendChild(cameraPlaceholder);
            }

            contentContainer.appendChild(scanSection);

            // Scanned items list - create container and assign it
            scannedItemsContainer = createEl('div', { style: 'margin-bottom:24px' });
            contentContainer.appendChild(scannedItemsContainer);
            
            // Initial render of scanned items
            updateScannedItemsDisplay();

            // Action buttons
            const actionsSection = createEl('div', { 
                style: 'display:flex;gap:12px;margin-top:24px;padding-top:24px;border-top:2px solid #eee'
            });

            // Pair Scanner button
            const pairBtn = createEl('button', {
                type: 'button',
                style: 'padding:12px 16px;background:#fff;border:2px solid #9c27b0;color:#9c27b0;border-radius:8px;cursor:pointer;font-weight:500'
            }, '🔗 Pair Scanner');
            pairBtn.addEventListener('click', () => {
                showPairingBarcode = true;
                render();
            });
            actionsSection.appendChild(pairBtn);

            // Clear button
            const clearBtn = createEl('button', {
                type: 'button',
                style: 'padding:12px 16px;background:#fff;border:2px solid #ff9800;color:#ff9800;border-radius:8px;cursor:pointer;font-weight:500;flex:1'
            }, '🗑️ Clear All');
            clearBtn.addEventListener('click', () => {
                if (scannedItems.size > 0 && confirm('Clear all scanned items?')) {
                    scannedItems.clear();
                    render();
                }
            });
            actionsSection.appendChild(clearBtn);

            // Apply button - assign to variable for updating
            applyButton = createEl('button', {
                type: 'button',
                class: 'btn-primary',
                style: 'padding:12px 24px;flex:1;font-weight:500'
            }, `✓ Update ${scannedItems.size} Item${scannedItems.size !== 1 ? 's' : ''}`) as HTMLButtonElement;
            applyButton.disabled = scannedItems.size === 0 || !updateValue;
            applyButton.addEventListener('click', async () => {
                if (scannedItems.size === 0) {
                    alert('No items scanned');
                    return;
                }

                if (!updateValue) {
                    alert('Please select a value to update');
                    return;
                }

                console.log('Batch update starting:', { 
                    updateMode, 
                    updateValue, 
                    scannedItemsCount: scannedItems.size 
                });

                const itemsToUpdate: InventoryItem[] = [];
                const now = new Date().toISOString();

                scannedItems.forEach(itemId => {
                    const item = items.find(i => i.id === itemId);
                    if (!item) {
                        console.warn('Item not found:', itemId);
                        return;
                    }

                    console.log('Processing item:', { id: item.id, name: item.name, currentLocation: item.location });

                    // Track changes
                    if (!item.history) item.history = [];

                    let hasChanges = false;

                    if (updateMode === 'location') {
                        const oldValue = item.location;
                        const newValue = updateValue as string;
                        console.log('Location update:', { oldValue, newValue, different: oldValue !== newValue });
                        if (oldValue !== newValue) {
                            item.location = newValue;
                            item.history.unshift({
                                timestamp: now,
                                user: currentUserName,
                                action: 'Batch update via scan',
                                changes: [{ field: 'Location', oldValue, newValue }]
                            });
                            hasChanges = true;
                        }
                    } else if (updateMode === 'status') {
                        const oldValue = item.status;
                        const newValue = updateValue as string;
                        console.log('Status update:', { oldValue, newValue, different: oldValue !== newValue });
                        if (oldValue !== newValue) {
                            item.status = newValue;
                            item.history.unshift({
                                timestamp: now,
                                user: currentUserName,
                                action: 'Batch update via scan',
                                changes: [{ field: 'Status', oldValue, newValue }]
                            });
                            hasChanges = true;
                        }
                    } else if (updateMode === 'assignedTo') {
                        const oldPersonId = item.assignedToPersonId;
                        const newPersonId = updateValue as number;
                        console.log('AssignedTo update:', { oldPersonId, newPersonId, different: oldPersonId !== newPersonId });
                        // We'd need to fetch person name here, but for now just update the ID
                        if (oldPersonId !== newPersonId) {
                            item.assignedToPersonId = newPersonId;
                            item.history.unshift({
                                timestamp: now,
                                user: currentUserName,
                                action: 'Batch update via scan',
                                changes: [{ 
                                    field: 'Assigned To', 
                                    oldValue: oldPersonId ? String(oldPersonId) : undefined,
                                    newValue: String(newPersonId)
                                }]
                            });
                            hasChanges = true;
                        }
                    }

                    if (hasChanges) {
                        item.updatedBy = currentUserName;
                        item.updatedAt = now;
                        itemsToUpdate.push(item);
                        console.log('Item will be updated:', item.id);
                    } else {
                        console.log('No changes for item:', item.id);
                    }
                });

                console.log('Items to update:', itemsToUpdate.length);

                if (itemsToUpdate.length === 0) {
                    alert('No changes detected. Items may already have the selected value.');
                    return;
                }

                console.log('Calling onUpdate callback...');
                await callbacks?.onUpdate(itemsToUpdate);
                console.log('onUpdate callback completed');
                
                // Reset state
                scannedItems.clear();
                updateValue = undefined;
                alert(`Updated ${itemsToUpdate.length} item(s)`);
                closeModal();
            });
            actionsSection.appendChild(applyButton);

            contentContainer.appendChild(actionsSection);
        };

        modalBox.appendChild(contentContainer);
        render();
    }

    return { open, close: closeModal };
}
