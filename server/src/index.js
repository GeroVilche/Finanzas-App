import express from 'express';
import { pool } from './db.js';
import movementsRouter from './routes/movements.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use('/api/movements', movementsRouter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error de conexión a la base:', error.code ?? error.message);
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});