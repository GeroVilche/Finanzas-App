// ===== 1. Imports =====
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';

const router = Router();

// ===== 2. Constantes =====
// TODO (etapa 3): reemplazar por el usuario logueado
const USER_ID = 1;

// ===== 3. Schema de validación =====
const movementSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD'),
    accountId: z.number().int().positive(),
    toAccountId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    note: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'transfer') {
      if (!data.toAccountId) {
        ctx.addIssue({ code: 'custom', path: ['toAccountId'], message: 'Una transferencia necesita cuenta destino' });
      }
      if (data.toAccountId === data.accountId) {
        ctx.addIssue({ code: 'custom', path: ['toAccountId'], message: 'La cuenta destino tiene que ser distinta a la de origen' });
      }
      if (data.categoryId) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Una transferencia no lleva categoría' });
      }
    } else {
      if (!data.categoryId) {
        ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Los ingresos y gastos necesitan categoría' });
      }
      if (data.toAccountId) {
        ctx.addIssue({ code: 'custom', path: ['toAccountId'], message: 'Solo las transferencias llevan cuenta destino' });
      }
    }
  });

const listQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'El mes debe tener formato AAAA-MM'),
  });

// ===== 4. Función auxiliar =====
function toMovementResponse(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    accountId: row.account_id,
    accountName: row.account_name,
    toAccountId: row.to_account_id,
    toAccountName: row.to_account_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    note: row.note,
    createdAt: row.created_at,
  };
}

// ===== 5. POST /api/movements =====
router.post('/', async (req, res) => {
  // a) Validar los datos
  const result = movementSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: result.error.issues });
  }

  const { type, amount, date, accountId, toAccountId, categoryId, note } = result.data;

  try {
    // b) Las cuentas tienen que ser del usuario
    const accountIds = toAccountId ? [accountId, toAccountId] : [accountId];
    const { rows: accounts } = await pool.query(
      'SELECT id FROM accounts WHERE user_id = $1 AND id = ANY($2)',
      [USER_ID, accountIds],
    );
    if (accounts.length !== accountIds.length) {
      return res.status(400).json({ error: 'Cuenta inexistente' });
    }

    // c) La categoría tiene que ser del usuario y del tipo correcto
    if (categoryId) {
      const { rows: categories } = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND kind = $3',
        [categoryId, USER_ID, type],
      );
      if (categories.length === 0) {
        return res.status(400).json({ error: 'Categoría inexistente o de otro tipo' });
      }
    }

    // d) Guardar en la base
    const { rows } = await pool.query(
      `INSERT INTO movements (user_id, type, amount, date, account_id, to_account_id, category_id, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, amount, date::text AS date, account_id, to_account_id, category_id, note, created_at`,
      [USER_ID, type, amount, date, accountId, toAccountId ?? null, categoryId ?? null, note ?? null],
    );

    res.status(201).json(toMovementResponse(rows[0]));
  } catch (error) {
    console.error('Error creando movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== GET /api/movements?month=AAAA-MM =====
router.get('/', async (req, res) => {
  const result = listQuerySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ error: 'Parámetros inválidos', details: result.error.issues });
  }

  const firstDay = `${result.data.month}-01`;

  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.type, m.amount, m.date::text AS date,
              m.account_id, a.name AS account_name,
              m.to_account_id, ta.name AS to_account_name,
              m.category_id, c.name AS category_name,
              m.note, m.created_at
       FROM movements m
       JOIN accounts a ON a.id = m.account_id
       LEFT JOIN accounts ta ON ta.id = m.to_account_id
       LEFT JOIN categories c ON c.id = m.category_id
       WHERE m.user_id = $1
         AND m.date >= $2::date
         AND m.date < $2::date + INTERVAL '1 month'
       ORDER BY m.date DESC, m.id DESC`,
      [USER_ID, firstDay],
    );

    res.json(rows.map(toMovementResponse));
  } catch (error) {
    console.error('Error listando movimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== 6. Export =====
export default router;