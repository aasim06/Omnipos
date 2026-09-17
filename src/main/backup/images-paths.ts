import { app } from 'electron';
import { existsSync, mkdirSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';

/** Absolute path to Omnipos userData/images */
export function getImagesRoot(): string {
  const dir = join(app.getPath('userData'), 'images');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getImagesDir(sub: string): string {
  const dir = join(getImagesRoot(), sub);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Store relative paths like `images/products/<id>.<ext>` so backups
 * work seamlessly across different machines and operating systems.
 */
export function toStoredImagePath(absolutePath: string): string {
  const userData = normalize(app.getPath('userData'));
  const abs = normalize(absolutePath);
  if (abs.toLowerCase().startsWith(userData.toLowerCase() + sep)) {
    return abs.slice(userData.length + 1).split(/[/\\]/).join('/');
  }
  const marker = abs.match(/[\\/]images[\\/].+$/i);
  if (marker) {
    return marker[0].replace(/^[\\/]+/, '').split(/[/\\]/).join('/');
  }
  return abs;
}

/** Resolve stored path (relative or absolute) to an absolute file path. */
export function resolveImagePath(stored: string): string {
  if (!stored) return stored;
  const userData = app.getPath('userData');
  const normalized = stored.replace(/\//g, sep);

  if (
    normalized.startsWith(`images${sep}`) ||
    normalized.startsWith('images/') ||
    normalized === 'images'
  ) {
    return join(userData, normalized);
  }

  if (existsSync(stored)) return stored;

  const marker = stored.match(/[\\/]images[\\/].+$/i);
  if (marker) {
    const relative = marker[0].replace(/^[\\/]+/, '');
    return join(userData, relative);
  }

  return join(userData, normalized);
}
