// Settings modal UI component
import type { InventorySettings, InventoryItem, MasterdataItem } from '../types';
import { createEl } from '../utils';

export interface SettingsModalCallbacks {
    onSave: (settings: InventorySettings) => Promise<void>;
    onClose: () => void;
    getItems?: () => InventoryItem[]; // For usage tracking
}

export function createSettingsModal(container: HTMLElement) {
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

    async function open(settings: InventorySettings, callbacks?: SettingsModalCallbacks) {
        modalBox.innerHTML = '';
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('open'));
        document.addEventListener('keydown', onKeyDown);

        const xBtn = createEl('button', { type: 'button', class: 'modal-close-btn', 'aria-label': 'Close' }, '✕');
        xBtn.addEventListener('click', () => {
            closeModal();
            callbacks?.onClose();
        });
        modalBox.appendChild(xBtn);

        const title = createEl('h2', {}, '⚙️ Settings');
        modalBox.appendChild(title);

        // Initialize masterdata if needed
        if (!settings.masterdata) {
            settings.masterdata = {
                manufacturers: [],
                locations: [],
                models: []
            };
        }

        // Tabs
        const tabSection = createEl('div', { style: 'display:flex;gap:8px;margin:16px 0;border-bottom:2px solid #e0e0e0' });
        const generalTab = createEl('button', { 
            type: 'button',
            class: 'settings-tab active',
            style: 'padding:8px 16px;border:none;background:none;cursor:pointer;border-bottom:2px solid #1976d2;font-weight:500'
        }, '⚙️ General');
        const masterdataTab = createEl('button', { 
            type: 'button',
            class: 'settings-tab',
            style: 'padding:8px 16px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent'
        }, '📊 Masterdata');
        
        tabSection.appendChild(generalTab);
        tabSection.appendChild(masterdataTab);
        modalBox.appendChild(tabSection);

        const contentContainer = createEl('div', { style: 'max-height:60vh;overflow-y:auto;padding:8px 0' });
        modalBox.appendChild(contentContainer);

        const renderGeneralTab = () => {
            contentContainer.innerHTML = '';
            
            // Asset Prefixes section
            const prefixesHeader = createEl('h3', {}, 'Asset ID Prefixes');
            contentContainer.appendChild(prefixesHeader);

            const prefixesList = createEl('div', { style: 'margin:8px 0' });
            const renderPrefixes = () => {
                prefixesList.innerHTML = '';
                settings.assetPrefixes.forEach((prefix, idx) => {
                    const item = createEl('div', { style: 'display:flex;gap:8px;align-items:center;margin:4px 0' });
                    item.appendChild(createEl('span', {}, prefix));
                    const delBtn = createEl('button', { type: 'button' }, '🗑️');
                    delBtn.addEventListener('click', async () => {
                        settings.assetPrefixes.splice(idx, 1);
                        await callbacks?.onSave(settings);
                        renderPrefixes();
                    });
                    item.appendChild(delBtn);
                    prefixesList.appendChild(item);
                });
            };
            renderPrefixes();
            contentContainer.appendChild(prefixesList);

            const addPrefixForm = createEl('form', { style: 'display:flex;gap:8px;margin:8px 0' }) as HTMLFormElement;
            const newPrefixInput = createEl('input', { placeholder: 'New prefix (e.g., CAM, MIC)', required: 'true' }) as HTMLInputElement;
            const addPrefixBtn = createEl('button', { type: 'submit' }, '+ Add Prefix');
            addPrefixForm.appendChild(newPrefixInput);
            addPrefixForm.appendChild(addPrefixBtn);
            addPrefixForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const prefix = newPrefixInput.value.trim().toUpperCase();
                if (prefix && !settings.assetPrefixes.includes(prefix)) {
                    settings.assetPrefixes.push(prefix);
                    await callbacks?.onSave(settings);
                    renderPrefixes();
                    newPrefixInput.value = '';
                }
            });
            contentContainer.appendChild(addPrefixForm);

            // Note about statuses
            const statusesNote = createEl('div', { style: 'margin-top:24px;padding:12px;background:#f5f5f5;border-radius:4px' });
            statusesNote.appendChild(createEl('h3', {}, 'Asset Statuses'));
            statusesNote.appendChild(createEl('p', { style: 'margin:8px 0;color:#666' }, 'Status options are fixed and include: Available, Broken, In Repair, Sold, Scrapped, Assigned to Person, and Installed. Status changes are made directly from the asset details.'));
            contentContainer.appendChild(statusesNote);

            // Legacy locations note
            if (settings.locations && settings.locations.length > 0) {
                const legacyNote = createEl('div', { style: 'margin-top:24px;padding:12px;background:#fff3cd;border-radius:4px;border-left:4px solid #ffc107' });
                legacyNote.appendChild(createEl('h3', {}, '📍 Legacy Locations'));
                legacyNote.appendChild(createEl('p', { style: 'margin:8px 0;color:#856404' }, 'You have legacy locations. These have been migrated to the Masterdata tab. You can safely ignore this.'));
                contentContainer.appendChild(legacyNote);
            }
        };

        const renderMasterdataTab = () => {
            contentContainer.innerHTML = '';

            type MasterdataType = 'manufacturers' | 'locations' | 'models';
            const types: Array<{ key: MasterdataType; label: string; icon: string }> = [
                { key: 'manufacturers', label: 'Manufacturers', icon: '🏭' },
                { key: 'locations', label: 'Locations', icon: '📍' },
                { key: 'models', label: 'Models', icon: '📦' }
            ];

            types.forEach(({ key, label, icon }) => {
                const section = createEl('div', { style: 'margin-bottom:24px' });
                const header = createEl('h3', {}, `${icon} ${label}`);
                section.appendChild(header);

                const list = createEl('div', { style: 'margin:8px 0' });
                const renderList = () => {
                    list.innerHTML = '';
                    const items = settings.masterdata![key];
                    
                    if (items.length === 0) {
                        const empty = createEl('div', { style: 'color:#999;font-style:italic;padding:8px' }, `No ${label.toLowerCase()} yet`);
                        list.appendChild(empty);
                    } else {
                        items.forEach((item) => {
                            const row = createEl('div', { 
                                style: 'display:flex;gap:8px;align-items:center;margin:4px 0;padding:8px;background:#f9f9f9;border-radius:4px'
                            });
                            
                            const nameInput = createEl('input', { 
                                value: item.name,
                                style: 'flex:1;border:1px solid #ddd;padding:4px 8px;border-radius:4px'
                            }) as HTMLInputElement;
                            
                            let saveTimeout: number | undefined;
                            nameInput.addEventListener('input', () => {
                                if (saveTimeout) clearTimeout(saveTimeout);
                                saveTimeout = window.setTimeout(async () => {
                                    const newName = nameInput.value.trim();
                                    if (newName && newName !== item.name) {
                                        item.name = newName;
                                        item.updatedAt = new Date().toISOString();
                                        await callbacks?.onSave(settings);
                                    }
                                }, 500);
                            });
                            
                            row.appendChild(nameInput);
                            
                            // Show usage button
                            const usageBtn = createEl('button', { 
                                type: 'button',
                                style: 'padding:4px 8px;font-size:12px;background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;cursor:pointer'
                            }, '👁️ Usage');
                            usageBtn.addEventListener('click', () => {
                                const items = callbacks?.getItems?.() || [];
                                const usage: string[] = [];
                                
                                items.forEach(assetItem => {
                                    let fieldValue: string | undefined;
                                    if (key === 'manufacturers') fieldValue = assetItem.manufacturer;
                                    else if (key === 'locations') fieldValue = assetItem.location;
                                    else if (key === 'models') fieldValue = assetItem.model;
                                    
                                    if (fieldValue === item.name) {
                                        usage.push(`• ${assetItem.name} (ID: ${assetItem.assetId || assetItem.id})`);
                                    }
                                });
                                
                                if (usage.length === 0) {
                                    alert(`"${item.name}" is not used in any assets.`);
                                } else {
                                    alert(`"${item.name}" is used in ${usage.length} asset(s):\n\n${usage.join('\n')}`);
                                }
                            });
                            row.appendChild(usageBtn);
                            
                            // Delete button
                            const delBtn = createEl('button', { 
                                type: 'button',
                                style: 'padding:4px 8px;background:#ffebee;border:1px solid #ef5350;border-radius:4px;cursor:pointer'
                            }, '🗑️');
                            delBtn.addEventListener('click', async () => {
                                // Check usage
                                const items = callbacks?.getItems?.() || [];
                                const isUsed = items.some(assetItem => {
                                    if (key === 'manufacturers') return assetItem.manufacturer === item.name;
                                    if (key === 'locations') return assetItem.location === item.name;
                                    if (key === 'models') return assetItem.model === item.name;
                                    return false;
                                });
                                
                                if (isUsed) {
                                    alert(`Cannot delete "${item.name}" because it is currently used in one or more assets. Please reassign those assets first.`);
                                    return;
                                }
                                
                                if (confirm(`Delete "${item.name}"?`)) {
                                    const idx = settings.masterdata![key].findIndex(i => i.id === item.id);
                                    if (idx !== -1) {
                                        settings.masterdata![key].splice(idx, 1);
                                        await callbacks?.onSave(settings);
                                        renderList();
                                    }
                                }
                            });
                            row.appendChild(delBtn);
                            
                            list.appendChild(row);
                        });
                    }
                };
                renderList();
                section.appendChild(list);

                // Add new item form
                const addForm = createEl('form', { style: 'display:flex;gap:8px;margin:8px 0' }) as HTMLFormElement;
                const newInput = createEl('input', { 
                    placeholder: `New ${label.toLowerCase().slice(0, -1)}...`,
                    required: 'true' 
                }) as HTMLInputElement;
                const addBtn = createEl('button', { type: 'submit' }, `+ Add`);
                addForm.appendChild(newInput);
                addForm.appendChild(addBtn);
                addForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const name = newInput.value.trim();
                    if (name && !settings.masterdata![key].some(item => item.name === name)) {
                        const newItem: MasterdataItem = {
                            id: `${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        settings.masterdata![key].push(newItem);
                        await callbacks?.onSave(settings);
                        renderList();
                        newInput.value = '';
                    }
                });
                section.appendChild(addForm);

                contentContainer.appendChild(section);
            });
        };

        const switchTab = (tab: 'general' | 'masterdata') => {
            if (tab === 'general') {
                generalTab.classList.add('active');
                masterdataTab.classList.remove('active');
                generalTab.style.borderBottomColor = '#1976d2';
                masterdataTab.style.borderBottomColor = 'transparent';
                renderGeneralTab();
            } else {
                generalTab.classList.remove('active');
                masterdataTab.classList.add('active');
                generalTab.style.borderBottomColor = 'transparent';
                masterdataTab.style.borderBottomColor = '#1976d2';
                renderMasterdataTab();
            }
        };

        generalTab.addEventListener('click', () => switchTab('general'));
        masterdataTab.addEventListener('click', () => switchTab('masterdata'));

        // Render initial tab
        renderGeneralTab();

        // Close button
        const closeBtn = createEl('button', { type: 'button', style: 'margin-top:24px' }, 'Close');
        closeBtn.addEventListener('click', () => {
            closeModal();
            callbacks?.onClose();
        });
        modalBox.appendChild(closeBtn);
    }

    return { open, close: closeModal };
}
