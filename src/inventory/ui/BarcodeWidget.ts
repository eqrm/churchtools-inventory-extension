// Barcode widget component for inline barcode editing
import type { InventoryItem } from '../types';
import { createEl } from '../utils';

/**
 * Generate Code 128 barcode as SVG
 */
export function generateBarcodePattern(text: string, width: number = 200, height: number = 50): SVGElement {
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
        [2,1,1,2,3,2], [2,3,3,1,1,1,2]
    ];
    
    const START_B = 104;
    const STOP = 106;
    const values: number[] = [START_B];
    let checksum = START_B;
    
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const value = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
        values.push(value);
        checksum += value * (i + 1);
    }
    
    values.push(checksum % 103);
    values.push(STOP);
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.style.display = 'block';
    svg.style.background = 'white';
    
    const totalModules = values.length * 11 + 2;
    const moduleWidth = width / totalModules;
    let x = moduleWidth * 2;
    
    values.forEach(value => {
        const pattern = CODE128[value];
        for (let i = 0; i < pattern.length; i++) {
            const elementWidth = pattern[i] * moduleWidth;
            if (i % 2 === 0) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', String(x));
                rect.setAttribute('y', '2');
                rect.setAttribute('width', String(elementWidth));
                rect.setAttribute('height', String(height - 4));
                rect.setAttribute('fill', '#000');
                svg.appendChild(rect);
            }
            x += elementWidth;
        }
    });
    
    return svg;
}

export function createBarcodeWidget(
    initialBarcode: string,
    items: InventoryItem[],
    existingItem?: InventoryItem
) {
    const widget = createEl('div', { 
        style: 'padding:8px 12px;background:#f5f5f5;border-radius:6px;min-height:40px;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;margin-left:auto'
    });
    
    let currentBarcode = initialBarcode;
    let isEditing = false;
    
    const render = () => {
        widget.innerHTML = '';
        
        if (isEditing) {
            // Edit mode
            const input = createEl('input', {
                type: 'text',
                value: currentBarcode,
                placeholder: 'Scan or enter barcode...',
                style: 'width:300px;padding:6px 8px;border:1px solid #1976d2;border-radius:4px;font-family:monospace'
            }) as HTMLInputElement;
            
            const validation = createEl('div', { 
                style: 'font-size:11px;margin-top:4px'
            });
            
            const checkDuplicate = () => {
                const val = input.value.trim();
                if (!val) {
                    validation.textContent = '';
                    input.style.borderColor = '#1976d2';
                    return true;
                }
                
                const duplicate = items.find(item => 
                    item.barcode === val && item.id !== existingItem?.id
                );
                
                if (duplicate) {
                    validation.textContent = `⚠️ Already used by: ${duplicate.name}`;
                    validation.style.color = '#d32f2f';
                    input.style.borderColor = '#d32f2f';
                    return false;
                }
                
                validation.textContent = '✓ Available';
                validation.style.color = '#388e3c';
                input.style.borderColor = '#388e3c';
                return true;
            };
            
            input.addEventListener('input', checkDuplicate);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (checkDuplicate()) {
                        currentBarcode = input.value.trim();
                        isEditing = false;
                        render();
                    }
                } else if (e.key === 'Escape') {
                    isEditing = false;
                    render();
                }
            });
            
            widget.appendChild(input);
            widget.appendChild(validation);
            setTimeout(() => input.focus(), 50);
            
        } else if (currentBarcode) {
            // Display mode with barcode
            const container = createEl('div', {
                style: 'position:relative;display:flex;flex-direction:column;gap:4px;background:white;padding:8px;border-radius:4px;border:1px solid #e0e0e0'
            });
            
            const svg = generateBarcodePattern(currentBarcode, 180, 40);
            container.appendChild(svg);
            
            const text = createEl('div', {
                style: 'font-family:monospace;font-size:11px;text-align:center;color:#666'
            }, currentBarcode);
            container.appendChild(text);
            
            const editBtn = createEl('button', {
                type: 'button',
                style: 'position:absolute;top:4px;right:4px;padding:4px 8px;font-size:11px;background:rgba(255,255,255,0.95);border:1px solid #ddd;border-radius:4px;cursor:pointer;opacity:0;transition:opacity 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.1)'
            }, '✏️ Edit');
            
            editBtn.addEventListener('click', () => {
                currentBarcode = ''; // Clear the barcode when entering edit mode
                isEditing = true;
                render();
            });
            
            container.appendChild(editBtn);
            widget.appendChild(container);
            
            widget.addEventListener('mouseenter', () => {
                editBtn.style.opacity = '1';
            });
            widget.addEventListener('mouseleave', () => {
                editBtn.style.opacity = '0';
            });
            
        } else {
            // No barcode set
            const message = createEl('div', {
                style: 'color:#999;font-size:13px'
            }, 'No barcode set');
            
            const setBtn = createEl('button', {
                type: 'button',
                style: 'margin-top:8px;padding:6px 12px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px'
            }, '+ Set Barcode');
            
            setBtn.addEventListener('click', () => {
                isEditing = true;
                render();
            });
            
            widget.appendChild(message);
            widget.appendChild(setBtn);
        }
    };
    
    render();
    
    return {
        element: widget,
        getValue: () => currentBarcode,
        setValue: (value: string) => {
            currentBarcode = value;
            render();
        }
    };
}
