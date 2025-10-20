/**
 * QRCodeDisplay Component
 * 
 * Displays a QR code image generated from an asset number or URL.
 */

import { useEffect, useState } from 'react';
import { Box, Image, Loader, Text } from '@mantine/core';
import { generateQRCode, type QRCodeOptions } from '../../services/barcode/BarcodeService';

interface QRCodeDisplayProps {
  /** The value to encode in the QR code (e.g., asset number or URL) */
  value: string;
  /** QR code generation options */
  options?: QRCodeOptions;
  /** Alt text for the image */
  alt?: string;
  /** Size of the QR code (width and height) */
  size?: number | string;
}

/**
 * Displays a QR code for the given value
 */
/* eslint-disable max-lines-per-function */
export function QRCodeDisplay({ value, options, alt, size = 200 }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function generate() {
      try {
        setLoading(true);
        setError(null);
        const url = await generateQRCode(value, options);
        if (mounted) {
          setQrCodeUrl(url);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void generate();

    return () => {
      mounted = false;
    };
  }, [value, options]);

  if (loading) {
    return (
      <Box style={{ width: size, height: size }} ta="center" py="md">
        <Loader size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ width: size, height: size }} ta="center" py="md">
        <Text size="sm" c="red">
          {error}
        </Text>
      </Box>
    );
  }

  if (!qrCodeUrl) {
    return null;
  }

  return (
    <Box style={{ width: size, height: size }} ta="center">
      <Image
        src={qrCodeUrl}
        alt={alt || `QR Code for ${value}`}
        fit="contain"
        w={size}
        h={size}
      />
    </Box>
  );
}
