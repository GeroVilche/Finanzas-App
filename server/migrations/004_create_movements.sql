CREATE TABLE movements (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount BIGINT NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT movement_type_rules CHECK (
    (type = 'transfer'
      AND to_account_id IS NOT NULL
      AND to_account_id <> account_id
      AND category_id IS NULL)
    OR
    (type IN ('income', 'expense')
      AND to_account_id IS NULL
      AND category_id IS NOT NULL)
  )
);

CREATE INDEX movements_user_date_idx ON movements (user_id, date);