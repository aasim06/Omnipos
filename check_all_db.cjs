const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const appData = path.join(process.env.APPDATA, 'Omnipos');
const files = fs.readdirSync(appData).filter(f => f.endsWith('.db'));
console.log('DB files in AppData:', files);

async function check() {
  for (const f of files) {
    const p = path.join(appData, f);
    const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + p } } });
    try {
      const pCount = await prisma.product.count();
      const cCount = await prisma.category.count();
      const oCount = await prisma.order.count();
      console.log(f, '-> Products:', pCount, 'Categories:', cCount, 'Orders:', oCount);
    } catch (e) {
      console.log(f, '-> Error:', e.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  // Also check all backups in Documents
  const docs = path.join(process.env.USERPROFILE, 'Documents');
  const backupFiles = fs.readdirSync(docs).filter(f => f.startsWith('Omnipos_Backup_') && f.endsWith('.db'));
  console.log('\nBackup files in Documents:', backupFiles);
  for (const f of backupFiles) {
    const p = path.join(docs, f);
    const prisma = new PrismaClient({ datasources: { db: { url: 'file:' + p } } });
    try {
      const pCount = await prisma.product.count();
      const cCount = await prisma.category.count();
      console.log(f, '-> Products:', pCount, 'Categories:', cCount);
    } catch (e) {
      console.log(f, '-> Error:', e.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}
check();
