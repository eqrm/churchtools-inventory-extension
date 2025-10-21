import { useState, useEffect, lazy, Suspense, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { Navigation } from './components/layout/Navigation';
import { QuickScanModal } from './components/scanner/QuickScanModal';

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
 * Error boundary for catching and displaying runtime errors (T221)
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Center h="100vh">
          <Stack align="center" gap="md" p="xl" style={{ maxWidth: 500 }}>
            <Text size="xl" fw={600} c="red">
              Something went wrong
            </Text>
            <Text c="dimmed" ta="center">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Please refresh the page to try again. If the problem persists, contact support.
            </Text>
          </Stack>
        </Center>
      );
    }

    return this.props.children;
  }
}

/**
 * Main application component with routing and global scanner
 */
/* eslint-disable max-lines-per-function */
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
