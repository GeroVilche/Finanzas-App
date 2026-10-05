import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db.js';

// Carpeta donde están los archivos .sql (server/migrations)
const MIGRATIONS_DIR = path.join(import.meta.dirname, '..', 'migrations');

async function migrate() {
    // Pedimos UNA conexión del pool, porque la transacción tiene que usar siempre la misma
    const client = await pool.connect();

    try {
        // 1. Tabla que registra qué migraciones ya se aplicaron
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `);

        // 2. Leemos cuáles ya están aplicadas
        const { rows } = await client.query('SELECT name FROM schema_migrations');
        const applied = new Set(rows.map((row) => row.name));

        // 3. Listamos los archivos .sql, ordenados por nombre (001, 002, 003...)
        const files = (await fs.readdir(MIGRATIONS_DIR))
        .filter((file) => file.endsWith('.sql'))
        .sort();

        // 4. Aplicamos las que faltan, una por una
        for (const file of files) {
            if (applied.has(file)) continue;

            const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
            console.log(`Aplicando ${file}...`);

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
            }   catch(error) {
                await client.query('ROLLBACK');
                throw new Error(`Falló la migración ${file}: ${error.message}`);
            }
        }

        console.log('Migraciones al día.');
    }   finally {
        client.release();
        await pool.end();
    }
}

migrate().catch((error) => {
    console.error(error.message);
    process.exit(1);
});