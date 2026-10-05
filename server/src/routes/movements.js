import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// La "forma" que tiene que tener un movimiento
const movementSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD'),
  accountId: z.number().int().positive(),
  toAccountId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  note: z.string().max(200).optional(),
});

// POST /api/movements
router.post('/', async (req, res) => {
  const result = movementSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: result.error.issues,
    });
  }

  // Temporal: devolvemos lo validado. En la parte B lo guardamos en la base.
  res.status(201).json(result.data);
});

export default router;