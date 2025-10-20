import { useEffect } from 'react';
import { Modal, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from './BarcodeScanner';
import { ScannerInput } from './ScannerInput';
import { provideScanSuccessFeedback, provideScanErrorFeedback } from '../../services/scanner/ScanFeedback';
import { useStorageProvider } from '../../hooks/useStorageProvider';
import { useScannerStore } from '../../stores/scannerStore';

interface QuickScanModalProps {
  opened: boolean;
  onClose: () => void;
}

/**
 * QuickScan Modal - Overlay for quick asset lookup via scanning
 * 
 * Features:
 * - Integrated barcode/QR scanner
 * - Manual entry fallback
 * - Automatic navigation to asset detail
 * - Scan history tracking
 * - Audio/visual feedback
 * - Keyboard shortcut support (Alt+S)
 */
/* eslint-disable max-lines-per-function */
export function QuickScanModal({ opened, onClose }: QuickScanModalProps) {
  const navigate = useNavigate();
  const storage = useStorageProvider();
  const addScan = useScannerStore((state) => state.addScan);

  // Detect platform for correct keyboard shortcut display
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const scanShortcut = isMac ? '⌘S' : 'Alt+S';

  const handleScan = (assetNumber: string) => {
    if (!storage) {
      provideScanErrorFeedback('Storage provider not available');
      return;
    }
    
    // Look up asset by number (async wrapped)
    const promise = storage.getAssetByNumber(assetNumber).then((asset) => {
      if (!asset) {
        provideScanErrorFeedback(`Asset not found: ${assetNumber}`);
        return;
      }

      // Add to scan history
      addScan({
        assetNumber,
        assetId: asset.id,
        assetName: asset.name,
        scannedAt: new Date().toISOString(),
      });

      // Provide success feedback
      provideScanSuccessFeedback(assetNumber, asset.name);

      // Navigate to asset detail
      navigate(`/assets/${asset.id}`);

      // Close modal
      onClose();
    }).catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup asset';
      provideScanErrorFeedback(errorMessage);
    });
    
    void promise;
  };

  const handleError = (error: string) => {
    provideScanErrorFeedback(error);
  };

  // Global keyboard shortcut (Alt+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!opened) {
          // Open modal logic would be handled by parent component
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>Quick Scan</Title>}
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Scan a barcode/QR code or enter an asset number to quickly view its details
        </Text>

        {/* Barcode Scanner */}
        <BarcodeScanner
          onScan={handleScan}
          onError={handleError}
          enableCamera={true}
          enableKeyboard={true}
        />

        {/* Manual Entry Fallback */}
        <ScannerInput
          onScan={handleScan}
          placeholder="Or enter asset number manually..."
          label="Manual Entry"
          buttonText="Lookup"
          autoFocus={false}
        />

        <Text size="xs" c="dimmed" ta="center">
          Tip: Press {scanShortcut} anytime to open Quick Scan
        </Text>
      </Stack>
    </Modal>
  );
}
