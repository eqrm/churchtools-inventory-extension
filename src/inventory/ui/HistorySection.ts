// History section component for Asset Modal
import type { InventoryItem } from '../types';
import { createEl } from '../utils';

export function createHistorySection(item?: InventoryItem): HTMLElement {
    const historyContent = createEl('div', { class: 'tab-content', style: 'display:none' });
    const historyList = createEl('div', { class: 'history-list' });
    
    if (item?.history && item.history.length > 0) {
        item.history.forEach(entry => {
            const historyItem = createEl('div', { class: 'history-item' });
            
            const historyHeader = createEl('div', { class: 'history-header' });
            const timestamp = createEl('span', { 
                class: 'history-timestamp' 
            }, new Date(entry.timestamp).toLocaleString());
            const user = createEl('span', { class: 'history-user' }, entry.user);
            historyHeader.appendChild(timestamp);
            historyHeader.appendChild(user);
            
            const action = createEl('div', { class: 'history-action' }, entry.action);
            
            historyItem.appendChild(historyHeader);
            historyItem.appendChild(action);
            
            if (entry.changes && entry.changes.length > 0) {
                const changesList = createEl('ul', { class: 'history-changes' });
                entry.changes.forEach(change => {
                    const changeItem = createEl('li', {});
                    changeItem.textContent = `${change.field}: "${change.oldValue ?? 'none'}" → "${change.newValue ?? 'none'}"`;
                    changesList.appendChild(changeItem);
                });
                historyItem.appendChild(changesList);
            }
            
            historyList.appendChild(historyItem);
        });
    } else {
        const emptyState = createEl('div', { 
            class: 'history-empty' 
        }, '📜 No history yet. Changes will be recorded here.');
        historyList.appendChild(emptyState);
    }
    
    historyContent.appendChild(historyList);
    return historyContent;
}
