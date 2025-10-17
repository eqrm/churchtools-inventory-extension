// Icon upload component for Asset Modal
import { createEl } from '../utils';

export function createIconUpload(existingIcon?: string) {
    const iconContainer = createEl('div', { class: 'asset-icon-container' });
    const iconPreview = createEl('div', { class: 'asset-icon-preview' });
    
    if (existingIcon) {
        const img = createEl('img', { src: existingIcon, alt: 'Asset icon' }) as HTMLImageElement;
        iconPreview.appendChild(img);
    } else {
        iconPreview.textContent = '📦';
    }
    
    const iconInput = createEl('input', { 
        type: 'file', 
        accept: 'image/*', 
        style: 'display:none', 
        id: 'asset-icon-upload' 
    }) as HTMLInputElement;
    
    iconInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                iconPreview.innerHTML = '';
                const img = createEl('img', { 
                    src: dataUrl, 
                    alt: 'Asset icon' 
                }) as HTMLImageElement;
                iconPreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
    
    const uploadLabel = createEl('label', { 
        for: 'asset-icon-upload', 
        class: 'asset-icon-upload-label' 
    }, '📷 Change');
    
    iconContainer.appendChild(iconPreview);
    iconContainer.appendChild(iconInput);
    iconContainer.appendChild(uploadLabel);
    
    return {
        element: iconContainer,
        getIconDataUrl: () => {
            const img = iconPreview.querySelector('img') as HTMLImageElement;
            return img?.src || undefined;
        }
    };
}
