import { useEffect, useState } from 'react';
import { Modal, Stack, Text, Select } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from './BarcodeScanner';
import { ScannerInput } from './ScannerInput';
import { provideScanSuccessFeedback, provideScanErrorFeedback } from '../../services/scanner/ScanFeedback';
import { useStorageProvider } from '../../hooks/useStorageProvider';
import { useScannerStore } from '../../stores/scannerStore';
import { useScannerPreference } from '../../hooks/useScannerPreference';
import type { ScannerModel } from '../../types/entities';

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
 
export function QuickScanModal({ opened, onClose }: QuickScanModalProps) {
  const navigate = useNavigate();
  const storage = useStorageProvider();
  const addScan = useScannerStore((state) => state.addScan);
  const { preferredScannerId, setPreference } = useScannerPreference();
  const [scannerModels, setScannerModels] = useState<ScannerModel[]>([]);

  // Load scanner models from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('scannerModels');
      if (stored) {
        setScannerModels(JSON.parse(stored) as ScannerModel[]);
      }
    } catch (error) {
      console.warn('Failed to load scanner models:', error);
    }
  }, []);

  // Detect platform for correct keyboard shortcut display
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const scanShortcut = isMac ? '⌘S' : 'Alt+S';

  const handleScan = (scannedCode: string) => {
    if (!storage) {
      provideScanErrorFeedback('Storage provider not available');
      return;
    }
    
    // Look up asset by barcode (async wrapped)
    const promise = storage.getAssets().then((assets) => {
      // First try to find by barcode (for reassigned barcodes)
      let asset = assets.find(a => a.barcode === scannedCode);
      
      // Fallback to asset number if not found by barcode
      if (!asset) {
        asset = assets.find(a => a.assetNumber === scannedCode);
      }
      
      if (!asset) {
        provideScanErrorFeedback(`Asset not found: ${scannedCode}`);
        return;
      }

      // Add to scan history
      addScan({
        assetNumber: scannedCode,
        assetId: asset.id,
        assetName: asset.name,
        scannedAt: new Date().toISOString(),
      });

      // Provide success feedback
      provideScanSuccessFeedback(scannedCode, asset.name);

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
      title="Quick Scan"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Scan a barcode or enter a barcode/asset number to quickly view asset details
        </Text>

        {/* Scanner Selection */}
        {scannerModels.length > 0 && (
          <Select
            label="Scanner Model"
            placeholder="Select scanner model"
            description="Choose your scanner model for optimized scanning"
            data={scannerModels.map(model => ({
              value: model.id,
              label: `${model.manufacturer} ${model.modelName}`,
            }))}
            value={preferredScannerId || null}
            onChange={(value) => setPreference(value)}
            allowDeselect
          />
        )}

        {/* Barcode Scanner */}
        <BarcodeScanner
          onScan={handleScan}
          onError={handleError}
          enableCamera={true}
          enableKeyboard={true}
          scannerModels={scannerModels}
          selectedScannerId={preferredScannerId}
        />

        {/* Manual Entry Fallback */}
        <ScannerInput
          onScan={handleScan}
          placeholder="Or enter barcode/asset number manually..."
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
