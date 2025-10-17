// Status selector component
import { FIXED_STATUSES } from '../constants';
import { createEl } from '../utils';

export function createStatusSelector(initialStatus: string = 'Available') {
    const container = createEl('div', { 
        class: 'status-buttons-wrapper',
        style: 'display:flex;gap:8px;flex-wrap:wrap'
    });
    
    let currentStatus = initialStatus;
    const buttons: HTMLButtonElement[] = [];
    
    const updateButtons = () => {
        buttons.forEach(btn => {
            if (btn.dataset.status === currentStatus) {
                btn.classList.add('active');
                btn.style.background = '#1976d2';
                btn.style.color = '#fff';
            } else {
                btn.classList.remove('active');
                btn.style.background = '#f0f0f0';
                btn.style.color = '#333';
            }
        });
    };
    
    FIXED_STATUSES.forEach(status => {
        const btn = createEl('button', {
            type: 'button',
            'data-status': status,
            style: 'padding:6px 12px;border:1px solid #ddd;border-radius:4px;cursor:pointer;font-size:13px;transition:all 0.2s'
        }, status) as HTMLButtonElement;
        
        btn.addEventListener('click', () => {
            currentStatus = status;
            updateButtons();
        });
        
        buttons.push(btn);
        container.appendChild(btn);
    });
    
    updateButtons();
    
    return {
        element: container,
        getValue: () => currentStatus,
        setValue: (status: string) => {
            currentStatus = status;
            updateButtons();
        }
    };
}
