// Asset form component - builds the main form fields
import type { InventoryItem, InventorySettings, PrefixCounters } from '../types';
import { createEl } from '../utils';
import { createMasterdataSearcher } from '../components/MasterdataSearcher';
import { createPersonSearcher } from '../components/PersonSearcher';
import { createSearchableDropdown } from '../components/SearchableDropdown';
import { createStatusSelector } from './StatusSelector';
import { nextAssetId } from '../services/assetId.service';

export interface AssetFormFields {
    manufacturerSearcher: ReturnType<typeof createMasterdataSearcher>;
    modelSearcher: ReturnType<typeof createMasterdataSearcher>;
    locationSearcher: ReturnType<typeof createMasterdataSearcher>;
    personSearcher: ReturnType<typeof createPersonSearcher>;
    statusSelector: ReturnType<typeof createStatusSelector>;
    nameField: HTMLInputElement;
    serialNumberField: HTMLInputElement;
    notesField: HTMLTextAreaElement;
    tagsField: HTMLInputElement;
    prefixDropdown?: ReturnType<typeof createSearchableDropdown>;
    form: HTMLFormElement;
}

export function createAssetForm(
    settings: InventorySettings,
    items: InventoryItem[],
    prefixCounters: PrefixCounters,
    existing?: InventoryItem,
    onAssetIdChange?: (assetId: string) => void
): AssetFormFields {
    const form = createEl('form', { class: 'asset-form' }) as HTMLFormElement;
    
    // Initialize masterdata if needed
    if (!settings.masterdata) {
        settings.masterdata = {
            manufacturers: [],
            locations: [],
            models: []
        };
    }
    
    // Masterdata searchers
    const manufacturerSearcher = createMasterdataSearcher(
        'manufacturers',
        settings.masterdata.manufacturers,
        existing?.manufacturer,
        async (name) => {
            const newItem = { 
                id: `mfg-${Date.now()}`, 
                name, 
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            settings.masterdata!.manufacturers.push(newItem);
            await import('../services/storage.service').then(m => m.saveSettings(settings));
        }
    );
    
    const modelSearcher = createMasterdataSearcher(
        'models',
        settings.masterdata.models,
        existing?.model,
        async (name) => {
            const newItem = { 
                id: `mdl-${Date.now()}`, 
                name, 
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            settings.masterdata!.models.push(newItem);
            await import('../services/storage.service').then(m => m.saveSettings(settings));
        }
    );
    
    const locationSearcher = createMasterdataSearcher(
        'locations',
        settings.masterdata.locations,
        existing?.location,
        async (name) => {
            const newItem = { 
                id: `loc-${Date.now()}`, 
                name, 
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            settings.masterdata!.locations.push(newItem);
            await import('../services/storage.service').then(m => m.saveSettings(settings));
        }
    );
    
    const personSearcher = createPersonSearcher(
        existing?.assignedToPersonId, 
        existing?.assignedToPersonName
    );
    
    const statusSelector = createStatusSelector(existing?.status || 'Available');
    
    // Form fields
    const nameField = createEl('input', { 
        type: 'text', 
        value: existing?.name || '', 
        placeholder: 'e.g., Laptop Dell XPS 15' 
    }) as HTMLInputElement;
    
    const serialNumberField = createEl('input', { 
        type: 'text', 
        value: existing?.serialNumber || '', 
        placeholder: 'e.g., SN123456' 
    }) as HTMLInputElement;
    
    const notesField = createEl('textarea', { 
        rows: '3', 
        placeholder: 'Additional notes...' 
    }) as HTMLTextAreaElement;
    notesField.value = existing?.notes || '';
    
    const tagsField = createEl('input', { 
        type: 'text', 
        value: existing?.tags?.join(', ') || '', 
        placeholder: 'e.g., electronics, office' 
    }) as HTMLInputElement;
    
    // Helper function to add form rows
    const addRow = (labelText: string, field: HTMLElement) => {
        form.appendChild(createEl('label', {}, labelText));
        form.appendChild(field);
    };
    
    // Build form
    addRow('Manufacturer', manufacturerSearcher.wrapper);
    addRow('Model', modelSearcher.wrapper);
    addRow('Serial Number', serialNumberField);
    addRow('Location', locationSearcher.wrapper);
    addRow('Status', statusSelector.element);
    addRow('Assigned To', personSearcher.wrapper);
    addRow('Notes', notesField);
    addRow('Tags (comma separated)', tagsField);
    
    // Prefix dropdown (only for new items)
    let prefixDropdown: ReturnType<typeof createSearchableDropdown> | undefined;
    if (!existing && settings.assetPrefixes && settings.assetPrefixes.length > 0) {
        prefixDropdown = createSearchableDropdown(
            settings.assetPrefixes,
            '',
            'Select or type prefix...'
        );
        
        addRow('Asset ID prefix', prefixDropdown.wrapper);
        
        const regenBtn = createEl('button', { 
            type: 'button', 
            class: 'btn-regen' 
        }, '🔄 Regenerate ID');
        const regenRow = createEl('div', { 
            style: 'grid-column: 2; margin-top: 8px' 
        });
        regenRow.appendChild(regenBtn);
        form.appendChild(regenRow);
        
        regenBtn.addEventListener('click', async () => {
            const prefix = prefixDropdown!.getValue();
            if (!prefix) return alert('Enter prefix to generate');
            try {
                const newAssetId = await nextAssetId(prefix, items, prefixCounters);
                onAssetIdChange?.(newAssetId);
                alert('Generated ' + newAssetId);
            } catch (e) {
                alert(String(e));
            }
        });
    }
    
    // Audit info for existing items
    if (existing?.createdBy && existing?.createdAt) {
        const auditRow = createEl('div', { class: 'audit-info' });
        auditRow.textContent = `Created by ${existing.createdBy} on ${new Date(existing.createdAt).toLocaleString()}`;
        if (existing.updatedBy && existing.updatedAt) {
            auditRow.textContent += ` • Last updated by ${existing.updatedBy} on ${new Date(existing.updatedAt).toLocaleString()}`;
        }
        form.appendChild(auditRow);
    }
    
    return {
        manufacturerSearcher,
        modelSearcher,
        locationSearcher,
        personSearcher,
        statusSelector,
        nameField,
        serialNumberField,
        notesField,
        tagsField,
        prefixDropdown,
        form
    };
}
