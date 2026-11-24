import JsBarcode from 'jsbarcode';

export interface BarcodeDataUrlOptions {
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC';
}

/**
 * Generates a high-contrast base64 PNG data URL of a 1D barcode (default: Code 128).
 * Compatible with thermal receipt printers, HTML documents, and on-screen displays.
 */
export function generateBarcodeDataUrl(
  value: string,
  options?: BarcodeDataUrlOptions
): string {
  if (typeof document === 'undefined') return '';
  const cleanVal = (value || '').trim();
  if (!cleanVal) return '';

  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, cleanVal, {
      format: options?.format || 'CODE128',
      width: options?.width ?? 1.5,
      height: options?.height ?? 38,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize ?? 11,
      margin: 4,
      background: '#FFFFFF',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[BarcodeGenerator] Could not generate barcode for:', cleanVal, err);
    return '';
  }
}
