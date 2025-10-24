import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
    const env = loadEnv(mode, process.cwd());
    process.env = { ...process.env, ...env };

    const rawDevMode = (
        env.VITE_DEV_MODE ??
        env.dev_mode ??
        process.env.VITE_DEV_MODE ??
        process.env.dev_mode ??
        ''
    ).toString();

    const rawBaseKey = (
        env.VITE_BASE_KEY ??
        env.base_key ??
        process.env.VITE_BASE_KEY ??
        process.env.base_key ??
        'fkoinventorymanagement'
    ).toString();

    const sanitizedBaseKey = rawBaseKey.trim().replace(/^(dev|prod|test)/i, '') || 'fkoinventorymanagement';
    const baseKey = sanitizedBaseKey.toLowerCase();

    const isDevMode = rawDevMode.trim().toLowerCase() === 'true';
    const extensionKey = isDevMode ? `dev${baseKey}` : baseKey;
    const devBaseKey = baseKey;

    process.env.VITE_BASE_KEY = baseKey;
    process.env.VITE_KEY = extensionKey;
    process.env.VITE_DEV_MODE = isDevMode ? 'true' : 'false';

    const basePath = mode === 'production'
        ? `/ccm/${extensionKey}/`
        : `/ccm/dev${devBaseKey}/`;

    console.log(`[34m[Inventory] Building with base key: ${baseKey} (${isDevMode ? 'dev' : 'prod'} mode)[0m`);

    return defineConfig({
        base: basePath,
        define: {
            'import.meta.env.VITE_BASE_KEY': JSON.stringify(baseKey),
            'import.meta.env.VITE_KEY': JSON.stringify(extensionKey),
            'import.meta.env.VITE_DEV_MODE': JSON.stringify(isDevMode ? 'true' : 'false'),
        },
        plugins: [react()],
        build: {
            // Bundle size optimization
            target: 'es2022',
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: true, // Remove console.log in production
                    drop_debugger: true,
                },
            },
            rollupOptions: {
                output: {
                    // Code splitting for better caching
                    manualChunks: {
                        // Vendor chunk for stable dependencies
                        vendor: ['react', 'react-dom'],
                        // Mantine UI chunk
                        mantine: [
                            '@mantine/core',
                            '@mantine/hooks',
                            '@mantine/form',
                            '@mantine/dates',
                            '@mantine/notifications',
                            '@mantine/dropzone',
                            'mantine-datatable',
                        ],
                        // State management chunk
                        state: ['@tanstack/react-query', 'zustand'],
                        // Barcode/QR chunk (loaded on demand)
                        scanner: ['jsbarcode', 'qrcode', 'html5-qrcode'],
                    },
                },
            },
            // Chunk size warning limit (5 MB = 5,000 KB for ChurchTools 20MB deployment limit)
            chunkSizeWarningLimit: 5000,
        },
        optimizeDeps: {
            // Pre-bundle dependencies for faster dev server
            include: [
                'react',
                'react-dom',
                '@mantine/core',
                '@mantine/hooks',
                '@tanstack/react-query',
                'zustand',
            ],
        },
    });
};
