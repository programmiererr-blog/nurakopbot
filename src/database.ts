import { createClient } from '@supabase/supabase-js';
import { ENV } from './config';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY);

export async function getUser(telegram_id: number) {
  const { data, error } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
  return data;
}

export async function createUser(telegram_id: number, full_name: string, username: string | undefined, referred_by?: number) {
  const { data, error } = await supabase.from('users').insert([{
    telegram_id,
    full_name,
    username,
    referred_by
  }]).select().single();
  
  if (referred_by && data) {
    await supabase.from('referrals').insert([{
      referrer_id: referred_by,
      referee_id: telegram_id,
      status: 'pending'
    }]);
  }
  return data;
}

export async function updatePhone(telegram_id: number, phone_number: string) {
  return await supabase.from('users').update({ phone_number }).eq('telegram_id', telegram_id);
}

export async function getReferralsCount(telegram_id: number) {
  const { count } = await supabase.from('referrals').select('*', { count: 'exact' }).eq('referrer_id', telegram_id).eq('status', 'rewarded');
  return count || 0;
}

export async function hasPermission(telegram_id: number, permission: 'can_approve_proofs' | 'can_approve_payments' | 'can_broadcast') {
  if (telegram_id === ENV.ADMIN_ID) return true;
  const { data } = await supabase.from('admins').select(permission).eq('telegram_id', telegram_id).single();
  return data ? (data as any)[permission] === true : false;
}

export async function getNotifiableAdmins(permission: 'can_approve_proofs' | 'can_approve_payments') {
  const { data } = await supabase.from('admins').select('telegram_id').eq(permission, true);
  const ids = new Set<number>();
  ids.add(ENV.ADMIN_ID);
  if (data) {
    data.forEach(a => ids.add(a.telegram_id));
  }
  return Array.from(ids);
}

export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single();
  return data ? data.value : defaultValue;
}

export async function updateSetting(key: string, value: string) {
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) console.error("Error updating setting:", error);
}
