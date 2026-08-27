-- users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT,
  phone_number TEXT,
  balance INTEGER DEFAULT 0,
  referred_by BIGINT REFERENCES users(telegram_id),
  is_voted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id BIGINT REFERENCES users(telegram_id),
  referee_id BIGINT REFERENCES users(telegram_id),
  reward_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, rewarded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(telegram_id),
  amount INTEGER NOT NULL,
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vote_proofs table
CREATE TABLE IF NOT EXISTS vote_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(telegram_id),
  photo_file_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);
