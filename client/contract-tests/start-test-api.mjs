// Levanta la API de TaskFlow para la verificación del provider:
// puerto 3001, base SQLite propia (server/prisma/taskflow_test.db, ignorada por git)
// recreada desde cero y con el seed cargado en cada arranque.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server');
const dbFile = path.join(serverDir, 'prisma', 'taskflow_test.db');

for (const file of [dbFile, `${dbFile}-journal`]) {
  fs.rmSync(file, { force: true });
}

const env = {
  ...process.env,
  DATABASE_URL: 'file:./taskflow_test.db',
  JWT_SECRET: 'contract-secret',
  PORT: '3001',
};
const run = (command) => execSync(command, { cwd: serverDir, env, stdio: 'inherit' });

run('npx prisma migrate deploy');
run('npx ts-node --transpile-only prisma/seed.ts');
run('npx ts-node --transpile-only src/index.ts');
