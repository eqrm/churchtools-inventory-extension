import { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { Navigation } from './components/layout/Navigation';
import { QuickScanModal } from './components/scanner/QuickScanModal';
import { DemoDataModal } from './components/onboarding/DemoDataModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { appRoutes } from './router';

/**
 * Loading fallback component for lazy-loaded routes
 */
function PageLoader() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">Loading...</Text>
      </Stack>
    </Center>
  );
}

/**
 * Main application component with routing and global scanner
 */
 
function App() {
  const [scanModalOpened, setScanModalOpened] = useState(false);

  // Global keyboard shortcut: Alt+S (Windows/Linux) or Cmd+S (macOS) to open scanner
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect macOS using userAgent (modern approach)
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
      const modifierPressed = isMac ? event.metaKey : event.altKey;
      
      if (modifierPressed && event.key.toLowerCase() === 's') {
        event.preventDefault();
        setScanModalOpened(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Navigation
          onScanClick={() => {
            setScanModalOpened(true);
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {appRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Navigation>

        {/* Global Quick Scan Modal - Alt+S anywhere to open */}
        <QuickScanModal
          opened={scanModalOpened}
          onClose={() => {
            setScanModalOpened(false);
          }}
        />

      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
