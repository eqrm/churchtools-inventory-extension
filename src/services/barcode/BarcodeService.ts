/**
 * Barcode and QR Code Generation Service
 * 
 * Provides utilities for generating barcodes and QR codes for asset identification.
 * Uses JsBarcode for barcode generation and qrcode for QR code generation.
 */

import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export interface BarcodeOptions {
  /** Width of a single bar (default: 2) */
  width?: number;
  /** Height of the barcode in pixels (default: 100) */
  height?: number;
  /** Whether to display the text below the barcode (default: true) */
  displayValue?: boolean;
  /** Font size of the text (default: 20) */
  fontSize?: number;
  /** Margin around the barcode in pixels (default: 10) */
  margin?: number;
  /** Barcode format (default: 'CODE128') */
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
}

export interface QRCodeOptions {
  /** Width and height of the QR code in pixels (default: 256) */
  width?: number;
  /** Error correction level (default: 'M') */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** Margin around the QR code in modules (default: 4) */
  margin?: number;
  /** Color of the dark modules (default: '#000000') */
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a barcode as a data URL
 * 
 * @param value - The value to encode in the barcode (e.g., asset number)
 * @param options - Barcode generation options
 * @returns Data URL of the generated barcode image
 * @throws Error if barcode generation fails
 */
export function generateBarcode(
  value: string,
  options: BarcodeOptions = {}
): string {
  const {
    width = 2,
    height = 100,
    displayValue = true,
    fontSize = 20,
    margin = 10,
    format = 'CODE128',
  } = options;

  // Create a canvas element
  const canvas = document.createElement('canvas');
  
  try {
    // Generate barcode on canvas
    JsBarcode(canvas, value, {
      format,
      width,
      height,
      displayValue,
      fontSize,
      margin,
      background: '#ffffff',
      lineColor: '#000000',
    });

    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    throw new Error(
      `Failed to generate barcode for "${value}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generates a QR code as a data URL
 * 
 * @param value - The value to encode in the QR code (e.g., asset URL or asset number)
 * @param options - QR code generation options
 * @returns Data URL of the generated QR code image
 * @throws Error if QR code generation fails
 */
export async function generateQRCode(
  value: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 256,
    errorCorrectionLevel = 'M',
    margin = 4,
    color = { dark: '#000000', light: '#ffffff' },
  } = options;

  try {
    // Generate QR code as data URL
    return await QRCode.toDataURL(value, {
      width,
      errorCorrectionLevel,
      margin,
      color,
    });
  } catch (error) {
    throw new Error(
      `Failed to generate QR code for "${value}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generates both a barcode and QR code for an asset
 * 
 * @param assetNumber - The asset number to encode
 * @param assetUrl - Optional URL for the QR code (defaults to asset number)
 * @param barcodeOptions - Barcode generation options
 * @param qrCodeOptions - QR code generation options
 * @returns Object containing both barcode and QR code data URLs
 */
export async function generateAssetCodes(
  assetNumber: string,
  assetUrl?: string,
  barcodeOptions?: BarcodeOptions,
  qrCodeOptions?: QRCodeOptions
): Promise<{ barcode: string; qrCode: string }> {
  const barcode = generateBarcode(assetNumber, barcodeOptions);
  const qrCode = await generateQRCode(assetUrl || assetNumber, qrCodeOptions);

  return { barcode, qrCode };
}

/**
 * Downloads a data URL as a PNG file
 * 
 * @param dataUrl - The data URL to download
 * @param filename - The filename for the downloaded file
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Prints an image from a data URL
 * 
 * @param dataUrl - The data URL to print
 * @param title - Optional title for the print window
 */
export function printImage(dataUrl: string, title = 'Print'): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="${title}" onload="window.print(); window.close();" />
      </body>
    </html>
  `;
  
  printWindow.document.documentElement.innerHTML = html;
}
