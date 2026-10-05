import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db.js';

const SEED_FILE = path.join(import.meta.dirname, '..', 'seeds', 'dev.sql');

try {
  const sql = await fs.readFile(SEED_FILE, 'utf8');
  await pool.query(sql);
  console.log('Datos de prueba cargados.');
} catch (error) {
  console.error('Error cargando datos de prueba:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}