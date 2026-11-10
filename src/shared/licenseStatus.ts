const DEVICE_OR_KEY_REMOVED_CODES = new Set([
  'not_found',
  'device',
  'device_not_found',
  'device_removed',
  'device_unlinked',
  'unlinked',
  'not_activated',
  'device_not_activated',
]);

const DISABLED_OR_SUSPENDED_CODES = new Set([
  'disabled',
  'suspended',
  'expired',
  'revoked',
  'blocked',
]);

/**
 * Determines whether a license validation failure means the device was removed/unlinked
 * or the license key no longer exists (so local license should be cleared and activation shown),
 * rather than the license key itself being disabled/suspended/expired.
 */
export function isDeviceOrKeyRemovedError(
  status: number,
  code?: string | null,
  error?: string | null,
): boolean {
  const normalizedCode = String(code || '').trim().toLowerCase();
  const normalizedError = String(error || '').trim().toLowerCase();

  if (status === 404 || DEVICE_OR_KEY_REMOVED_CODES.has(normalizedCode)) {
    return true;
  }

  if (DISABLED_OR_SUSPENDED_CODES.has(normalizedCode)) {
    return false;
  }

  return (
    normalizedError.includes('not activated for this license') ||
    normalizedError.includes('device is not activated') ||
    normalizedError.includes('device not activated') ||
    normalizedError.includes('device removed') ||
    normalizedError.includes('device has been removed') ||
    normalizedError.includes('device unlinked') ||
    normalizedError.includes('device not found') ||
    normalizedError.includes('license not found') ||
    normalizedError.includes('invalid license key')
  );
}

