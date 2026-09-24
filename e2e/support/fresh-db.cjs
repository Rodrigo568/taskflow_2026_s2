// Borra la base SQLite de e2e para que cada corrida arranque vacía.
// Solo toca server/prisma/e2e.db, que es exclusiva de estos tests.
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '..', '..', 'server', 'prisma', 'e2e.db');
for (const file of [dbFile, `${dbFile}-journal`]) {
  fs.rmSync(file, { force: true });
}
