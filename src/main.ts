import type { Person } from './utils/ct-types';
import { churchtoolsClient } from '@churchtools/churchtools-client';

// only import reset.css in development mode to keep the production bundle small and to simulate CT environment
if (import.meta.env.MODE === 'development') {
    import('./utils/reset.css');
}

declare const window: Window &
    typeof globalThis & {
        settings: {
            base_url?: string;
        };
    };

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
churchtoolsClient.setBaseUrl(baseUrl);

const username = import.meta.env.VITE_USERNAME;
const password = import.meta.env.VITE_PASSWORD;
if (import.meta.env.MODE === 'development' && username && password) {
    await churchtoolsClient.post('/login', { username, password });
}

const KEY = import.meta.env.VITE_KEY;
export { KEY };

const user = await churchtoolsClient.get<Person>(`/whoami`);

// Initialize the extension UI
import { initInventory } from './inventory';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
    <div style="max-width:900px;margin:18px auto;padding:12px">
        <div id="ct-user" style="margin-bottom:12px"></div>
        <div id="ct-inventory"></div>
    </div>
`;

(document.querySelector('#ct-user') as HTMLDivElement).textContent = `Signed in as ${[user.firstName, user.lastName].join(' ')}`;

initInventory(document.querySelector('#ct-inventory') as HTMLDivElement, {
        // example syncHandler: send to ChurchTools custom module endpoint (if available)
        syncHandler: async (items) => {
                // This is a placeholder. You can POST/PUT to your module endpoint here.
                // Example: await churchtoolsClient.post(`/custommodules/${KEY}/inventory/sync`, items);
                console.log('Sync handler called with items', items);
        }
});
