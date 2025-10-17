// Kits management UI component
import type { InventoryItem, Kit } from '../types';
import { createEl } from '../utils';

export interface KitsSectionCallbacks {
    onSave: (kits: Kit[]) => Promise<void>;
}

export function createKitsSection(container: HTMLElement) {
    const section = createEl('div', { style: 'display:none' });
    
    const form = createEl('form', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0' }) as HTMLFormElement;
    const kitName = createEl('input', { placeholder: 'Kit name', required: 'true', style: 'min-width:160px' }) as HTMLInputElement;
    const kitItemsSelect = createEl('select', { multiple: 'true', size: '6', style: 'min-width:320px' }) as HTMLSelectElement;
    const kitNotes = createEl('input', { placeholder: 'Notes', style: 'min-width:200px' }) as HTMLInputElement;
    const kitAddBtn = createEl('button', { type: 'submit' }, 'Create / Update Kit');
    
    form.appendChild(kitName);
    form.appendChild(kitItemsSelect);
    form.appendChild(kitNotes);
    form.appendChild(kitAddBtn);
    
    const kitsList = createEl('div');
    
    section.appendChild(form);
    section.appendChild(kitsList);
    container.appendChild(section);

    function updateItemsSelect(items: InventoryItem[]) {
        kitItemsSelect.innerHTML = '';
        for (const it of items) {
            const opt = createEl('option', { value: it.id }, `${it.name} (${it.quantity})`);
            kitItemsSelect.appendChild(opt);
        }
    }

    function render(kits: Kit[], items: InventoryItem[], callbacks?: KitsSectionCallbacks) {
        kitsList.innerHTML = '';
        kits.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        
        for (const k of kits) {
            const box = createEl('div', { style: 'padding:8px;border:1px solid #eee;margin:6px 0' });
            box.appendChild(createEl('strong', {}, k.name));
            box.appendChild(createEl('div', {}, `Items: ${k.itemIds.map(id => items.find(i => i.id === id)?.name ?? id).join(', ')}`));
            box.appendChild(createEl('div', {}, `Notes: ${k.notes ?? ''}`));
            
            const del = createEl('button', { type: 'button' }, 'Delete');
            del.addEventListener('click', async () => {
                if (!confirm(`Delete kit "${k.name}"?`)) return;
                const updatedKits = kits.filter(x => x.id !== k.id);
                await callbacks?.onSave(updatedKits);
            });
            box.appendChild(del);
            kitsList.appendChild(box);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // This will be handled by the parent component
        const submitEvent = new CustomEvent('kit-submit', {
            detail: {
                name: kitName.value.trim(),
                notes: kitNotes.value.trim(),
                itemIds: Array.from(kitItemsSelect.selectedOptions).map(o => o.value)
            }
        });
        section.dispatchEvent(submitEvent);
        form.reset();
    });

    return { 
        element: section, 
        render, 
        updateItemsSelect,
        addEventListener: (type: string, listener: EventListener) => section.addEventListener(type, listener)
    };
}
