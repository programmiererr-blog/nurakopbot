import { config } from 'dotenv';
config();

export const ENV = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  ADMIN_ID: Number(process.env.ADMIN_ID) || 0,
  MIN_WITHDRAW_AMOUNT: Number(process.env.MIN_WITHDRAW_AMOUNT) || 10000,
  VOTE_REWARD: Number(process.env.VOTE_REWARD) || 5000,
  REF_REWARD: Number(process.env.REF_REWARD) || 2000,
  PAYMENT_CHANNEL_ID: process.env.PAYMENT_CHANNEL_ID || '',
};
