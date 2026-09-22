import QRCode from 'qrcode';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generate a base64 PNG Data URL for any text or link.
 */
export async function generateQrDataUrl(
  text: string,
  options?: QrCodeOptions
): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    return await QRCode.toDataURL(text.trim(), {
      margin: options?.margin ?? 1,
      width: options?.width ?? 140,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}
