import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { Navigation } from './components/layout/Navigation';
import { QuickScanModal } from './components/scanner/QuickScanModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy load page components for code splitting (T215)
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const AssetsPage = lazy(() => import('./pages/AssetsPage').then(m => ({ default: m.AssetsPage })));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage').then(m => ({ default: m.AssetDetailPage })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then(m => ({ default: m.BookingsPage })));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage').then(m => ({ default: m.BookingDetailPage })));
const BookingCalendarPage = lazy(() => import('./pages/BookingCalendarPage').then(m => ({ default: m.BookingCalendarPage })));
const KitsPage = lazy(() => import('./pages/KitsPage').then(m => ({ default: m.KitsPage })));
const KitDetailPage = lazy(() => import('./pages/KitDetailPage').then(m => ({ default: m.KitDetailPage })));
const StockTakePage = lazy(() => import('./pages/StockTakePage').then(m => ({ default: m.StockTakePage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

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
              <Route path="/" element={<DashboardPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/bookings-calendar" element={<BookingCalendarPage />} />
              <Route path="/kits" element={<KitsPage />} />
              <Route path="/kits/:id" element={<KitDetailPage />} />
              <Route path="/stock-take" element={<StockTakePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:reportId" element={<ReportsPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/settings" element={<SettingsPage />} />
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
