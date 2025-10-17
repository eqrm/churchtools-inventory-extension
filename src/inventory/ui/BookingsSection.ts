// Bookings management UI component
import type { InventoryItem, Booking } from '../types';
import { createEl } from '../utils';

export interface BookingsSectionCallbacks {
    onSave: (bookings: Booking[]) => Promise<void>;
    onConflictCheck: (start: string, end: string, itemIds: string[], ignoreId?: string) => { conflict: boolean; booking?: Booking };
}

export function createBookingsSection(container: HTMLElement) {
    const section = createEl('div', { style: 'display:none' });
    
    const form = createEl('form', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0' }) as HTMLFormElement;
    const bookingTitle = createEl('input', { placeholder: 'Booking title', required: 'true', style: 'min-width:160px' }) as HTMLInputElement;
    const bookingStart = createEl('input', { type: 'datetime-local', required: 'true' }) as HTMLInputElement;
    const bookingEnd = createEl('input', { type: 'datetime-local', required: 'true' }) as HTMLInputElement;
    const bookingItemsSelect = createEl('select', { multiple: 'true', size: '6', style: 'min-width:320px' }) as HTMLSelectElement;
    const bookingAddBtn = createEl('button', { type: 'submit' }, 'Create Booking');
    
    form.appendChild(bookingTitle);
    form.appendChild(bookingStart);
    form.appendChild(bookingEnd);
    form.appendChild(bookingItemsSelect);
    form.appendChild(bookingAddBtn);
    
    const bookingsList = createEl('div');
    
    section.appendChild(form);
    section.appendChild(bookingsList);
    container.appendChild(section);

    function updateItemsSelect(items: InventoryItem[]) {
        bookingItemsSelect.innerHTML = '';
        for (const it of items) {
            const opt = createEl('option', { value: it.id }, `${it.name} (${it.quantity})`);
            bookingItemsSelect.appendChild(opt);
        }
    }

    function render(bookings: Booking[], items: InventoryItem[], callbacks?: BookingsSectionCallbacks) {
        bookingsList.innerHTML = '';
        bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        
        for (const bk of bookings) {
            const box = createEl('div', { style: 'padding:8px;border:1px solid #eee;margin:6px 0' });
            box.appendChild(createEl('strong', {}, bk.title));
            box.appendChild(createEl('div', {}, `From: ${new Date(bk.start).toLocaleString()} To: ${new Date(bk.end).toLocaleString()}`));
            box.appendChild(createEl('div', {}, `Items: ${bk.itemIds.map(id => items.find(i => i.id === id)?.name ?? id).join(', ')}`));
            
            const del = createEl('button', { type: 'button' }, 'Delete');
            del.addEventListener('click', async () => {
                if (!confirm(`Delete booking "${bk.title}"?`)) return;
                const updatedBookings = bookings.filter(b => b.id !== bk.id);
                await callbacks?.onSave(updatedBookings);
            });
            box.appendChild(del);
            bookingsList.appendChild(box);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // This will be handled by the parent component
        const submitEvent = new CustomEvent('booking-submit', {
            detail: {
                title: bookingTitle.value.trim(),
                start: new Date(bookingStart.value).toISOString(),
                end: new Date(bookingEnd.value).toISOString(),
                itemIds: Array.from(bookingItemsSelect.selectedOptions).map(o => o.value)
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
