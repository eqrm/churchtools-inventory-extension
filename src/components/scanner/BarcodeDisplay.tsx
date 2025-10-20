/**
 * BarcodeDisplay Component
 * 
 * Displays a barcode image generated from an asset number.
 */

import { useEffect, useState } from 'react';
import { Box, Image, Loader, Text } from '@mantine/core';
import { generateBarcode, type BarcodeOptions } from '../../services/barcode/BarcodeService';

interface BarcodeDisplayProps {
  /** The value to encode in the barcode (e.g., asset number) */
  value: string;
  /** Barcode generation options */
  options?: BarcodeOptions;
  /** Alt text for the image */
  alt?: string;
  /** Width of the container */
  width?: number | string;
}

/**
 * Displays a barcode for the given value
 */
export function BarcodeDisplay({ value, options, alt, width }: BarcodeDisplayProps) {
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      const url = generateBarcode(value, options);
      setBarcodeUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate barcode');
    } finally {
      setLoading(false);
    }
  }, [value, options]);

  if (loading) {
    return (
      <Box style={{ width }} ta="center" py="md">
        <Loader size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ width }} ta="center" py="md">
        <Text size="sm" c="red">
          {error}
        </Text>
      </Box>
    );
  }

  if (!barcodeUrl) {
    return null;
  }

  return (
    <Box style={{ width }} ta="center">
      <Image
        src={barcodeUrl}
        alt={alt || `Barcode for ${value}`}
        fit="contain"
        style={{ maxWidth: '100%' }}
      />
    </Box>
  );
}
