INSERT INTO users (email, password_hash, name)
VALUES ('gero@dev.local', 'sin-hash-todavia', 'Gero')
ON CONFLICT (email) DO NOTHING;

INSERT INTO accounts (user_id, name)
SELECT id, cuenta
FROM users, (VALUES ('Efectivo'), ('Mercado Pago')) AS c(cuenta)
WHERE email = 'gero@dev.local'
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO categories (user_id, name, kind, is_fixed)
SELECT id, nombre, tipo, fijo
FROM users, (VALUES
  ('Sueldo', 'income', false),
  ('Supermercado', 'expense', false),
  ('Alquiler', 'expense', true),
  ('Transporte', 'expense', false)
) AS c(nombre, tipo, fijo)
WHERE email = 'gero@dev.local'
ON CONFLICT (user_id, name, kind) DO NOTHING;