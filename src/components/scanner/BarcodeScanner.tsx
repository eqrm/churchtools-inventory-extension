import { useEffect, useRef, useState } from 'react';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { IconCamera, IconKeyboard, IconX } from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  enableCamera?: boolean;
  enableKeyboard?: boolean;
}

type ScanMode = 'keyboard' | 'camera';

/**
 * BarcodeScanner component - Handles USB/Bluetooth keyboard emulation + camera scanning
 * 
 * Features:
 * - Keyboard mode: Listens for barcode scanner input (USB/Bluetooth devices that emulate keyboard)
 * - Camera mode: Uses device camera with html5-qrcode library
 * - Automatic detection of Enter key after barcode scan
 * - Buffer management for rapid character input
 * - Cleanup on unmount
 */
/* eslint-disable max-lines-per-function */
export function BarcodeScanner({
  onScan,
  onError,
  onClose,
  enableCamera = true,
  enableKeyboard = true,
}: BarcodeScannerProps) {
  const [mode, setMode] = useState<ScanMode>('keyboard');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard scanning mode
  useEffect(() => {
    if (mode !== 'keyboard' || !enableKeyboard) {
      return;
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if typing in an input field (unless it's our scanner input)
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle Enter key - submit buffered code
      if (event.key === 'Enter' && bufferRef.current.length > 0) {
        const scannedValue = bufferRef.current.trim();
        bufferRef.current = '';
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (scannedValue.length > 0) {
          onScan(scannedValue);
        }
        return;
      }

      // Accumulate characters (alphanumeric, dash, underscore)
      if (/^[a-zA-Z0-9\-_]$/.test(event.key)) {
        bufferRef.current += event.key;

        // Clear buffer after 100ms of inactivity (in case Enter was missed)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          const scannedValue = bufferRef.current.trim();
          bufferRef.current = '';
          
          // Only submit if we have a reasonable barcode length (typically 8+ characters)
          if (scannedValue.length >= 5) {
            onScan(scannedValue);
          }
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mode, enableKeyboard, onScan]);

  // Camera scanning mode
  const startCamera = async () => {
    if (!enableCamera) {
      onError?.('Camera scanning is disabled');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('barcode-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          void stopCamera(); // Stop camera after successful scan
        },
        () => {
          // Ignore frequent scanning errors during active scanning
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start camera';
      onError?.(error);
      console.error('Camera start error:', err);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsCameraActive(false);
      } catch (err) {
        console.error('Camera stop error:', err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isCameraActive) {
        scannerRef.current.stop().catch((err: unknown) => {
          console.error('Camera cleanup error:', err);
        });
      }
    };
  }, [isCameraActive]);

  // Switch to camera mode and start
  const handleCameraMode = () => {
    setMode('camera');
    void startCamera();
  };

  // Switch to keyboard mode and stop camera
  const handleKeyboardMode = () => {
    void stopCamera();
    setMode('keyboard');
  };

  return (
    <Stack gap="md">
      {/* Mode selector */}
      <Group justify="space-between">
        <Group>
          {enableKeyboard && (
            <Button
              variant={mode === 'keyboard' ? 'filled' : 'light'}
              leftSection={<IconKeyboard size={16} />}
              onClick={handleKeyboardMode}
              disabled={mode === 'keyboard'}
            >
              USB Scanner
            </Button>
          )}
          {enableCamera && (
            <Button
              variant={mode === 'camera' ? 'filled' : 'light'}
              leftSection={<IconCamera size={16} />}
              onClick={handleCameraMode}
              disabled={isCameraActive}
            >
              Camera
            </Button>
          )}
        </Group>
        {onClose && (
          <Button
            variant="subtle"
            leftSection={<IconX size={16} />}
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </Group>

      {/* Scanner area */}
      <Box>
        {mode === 'keyboard' && (
          <Box
            p="xl"
            style={{
              border: '2px dashed var(--mantine-color-gray-4)',
              borderRadius: 'var(--mantine-radius-md)',
              textAlign: 'center',
            }}
          >
            <Stack gap="sm" align="center">
              <IconKeyboard size={48} stroke={1.5} color="var(--mantine-color-gray-6)" />
              <Text size="lg" fw={600}>
                Ready to Scan
              </Text>
              <Text size="sm" c="dimmed">
                Point your USB/Bluetooth barcode scanner at a barcode
              </Text>
              <Text size="xs" c="dimmed">
                The scanner will automatically detect the code
              </Text>
            </Stack>
          </Box>
        )}

        {mode === 'camera' && (
          <Box>
            <Box
              id="barcode-reader"
              style={{
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            />
            {!isCameraActive && (
              <Box
                p="xl"
                style={{
                  border: '2px dashed var(--mantine-color-gray-4)',
                  borderRadius: 'var(--mantine-radius-md)',
                  textAlign: 'center',
                }}
              >
                <Stack gap="sm" align="center">
                  <IconCamera size={48} stroke={1.5} color="var(--mantine-color-gray-6)" />
                  <Text size="sm" c="dimmed">
                    Camera will start automatically
                  </Text>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Stack>
  );
}
