import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import AdmZip from 'adm-zip';
import { disconnectPrisma, getPrisma, getPosDbPath } from '../database/client';
import { getImagesRoot } from './images-paths';

export { getPosDbPath };

export function defaultBackupFileName(at = new Date()): string {
  const stamp = at.toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `Omnipos_Backup_${stamp}.zip`;
}

export async function writeBackupZip(zipPath: string): Promise<void> {
  try {
    const db = getPrisma();
    await db.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);').catch(() => { /* ignore */ });
  } catch {
    /* ignore */
  }
  await disconnectPrisma();
  try {
    const zip = new AdmZip();
    const dbPath = getPosDbPath();
    if (existsSync(dbPath)) {
      zip.addFile('omnipos.db', readFileSync(dbPath));
    }

    const imagesRoot = getImagesRoot();
    if (existsSync(imagesRoot) && readdirSync(imagesRoot).length > 0) {
      zip.addLocalFolder(imagesRoot, 'images');
    }

    mkdirSync(dirname(zipPath), { recursive: true });
    zip.writeZip(zipPath);
  } finally {
    getPrisma();
  }
}

export function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) {
      copyDirRecursive(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}
