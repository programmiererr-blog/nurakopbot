import { bot } from '../bot';
import { supabase } from '../database';
import { ENV } from '../config';

import { hasPermission } from '../database';

// Approving vote proof
bot.callbackQuery(/^proof_approve_(.+)$/, async (ctx) => {
  if (!ctx.from) return;
  if (!await hasPermission(ctx.from.id, 'can_approve_proofs')) return ctx.answerCallbackQuery({ text: "Sizda ruxsat yo'q!", show_alert: true });

  const proofId = ctx.match[1];
  
  const { data: proof } = await supabase.from('vote_proofs').select('*').eq('id', proofId).single();
  if (!proof || proof.status !== 'pending') return ctx.answerCallbackQuery("Allaqachon ko'rib chiqilgan yoki topilmadi");

  // Update proof status
  await supabase.from('vote_proofs').update({ status: 'approved' }).eq('id', proofId);
  
  // Get user
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', proof.user_id).single();
  if (!user) return;

  // Reward user
  await supabase.from('users').update({ 
    balance: user.balance + ENV.VOTE_REWARD,
    is_voted: true
  }).eq('telegram_id', user.telegram_id);

  // Handle referrals
  if (user.referred_by) {
    const { data: refUser } = await supabase.from('users').select('*').eq('telegram_id', user.referred_by).single();
    if (refUser) {
      await supabase.from('users').update({ balance: refUser.balance + ENV.REF_REWARD }).eq('telegram_id', refUser.telegram_id);
      await supabase.from('referrals').update({ status: 'rewarded', reward_amount: ENV.REF_REWARD }).eq('referee_id', user.telegram_id).eq('referrer_id', refUser.telegram_id);
      
      // Notify referrer
      try {
        await ctx.api.sendMessage(refUser.telegram_id, `🎉 Siz taklif qilgan do'stingiz ovoz berdi va sizga ${ENV.REF_REWARD} so'm bonus berildi!`);
      } catch (e) {}
    }
  }

  await ctx.editMessageCaption({ caption: ctx.callbackQuery.message?.caption + '\n\n✅ Tasdiqlangan' });
  await ctx.answerCallbackQuery('Tasdiqlandi va bonus berildi.');
  
  try {
    await ctx.api.sendMessage(user.telegram_id, `✅ Ovoz berganingiz tasdiqlandi va hisobingizga ${ENV.VOTE_REWARD} so'm qo'shildi!`);
  } catch (e) {}
});

// Rejecting vote proof
bot.callbackQuery(/^proof_reject_(.+)$/, async (ctx) => {
  if (!ctx.from) return;
  if (!await hasPermission(ctx.from.id, 'can_approve_proofs')) return ctx.answerCallbackQuery({ text: "Sizda ruxsat yo'q!", show_alert: true });

  const proofId = ctx.match[1];
  
  const { data: proof } = await supabase.from('vote_proofs').select('*').eq('id', proofId).single();
  if (!proof || proof.status !== 'pending') return ctx.answerCallbackQuery("Allaqachon ko'rib chiqilgan yoki topilmadi");

  await supabase.from('vote_proofs').update({ status: 'rejected' }).eq('id', proofId);
  
  await ctx.editMessageCaption({ caption: ctx.callbackQuery.message?.caption + '\n\n❌ Rad etilgan' });
  await ctx.answerCallbackQuery('Rad etildi.');
  
  try {
    await ctx.api.sendMessage(proof.user_id, `❌ Ovoz berish skrinshotingiz rad etildi. Iltimos, qayta to'g'ri skrinshot yuboring.`);
  } catch (e) {}
});

// Approving payment
bot.callbackQuery(/^pay_approve_(.+)$/, async (ctx) => {
  if (!ctx.from) return;
  if (!await hasPermission(ctx.from.id, 'can_approve_payments')) return ctx.answerCallbackQuery({ text: "Sizda ruxsat yo'q!", show_alert: true });

  const payId = ctx.match[1];
  
  const { data: payment } = await supabase.from('withdrawals').select('*').eq('id', payId).single();
  if (!payment || payment.status !== 'pending') return ctx.answerCallbackQuery("Allaqachon ko'rib chiqilgan yoki topilmadi");

  await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', payId);
  
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', payment.user_id).single();

  await ctx.editMessageText(ctx.callbackQuery.message?.text + "\n\n✅ To'landi");
  await ctx.answerCallbackQuery("To'landi.");
  
  try {
    await ctx.api.sendMessage(payment.user_id, `✅ ${payment.amount} so'm pul yechish so'rovingiz tasdiqlandi va to'lab berildi!`);
  } catch (e) {}

  if (ENV.PAYMENT_CHANNEL_ID) {
    const channelMsg = `✅ <b>Muvaffaqiyatli to'lov!</b>\n\n👤 Foydalanuvchi: ${user?.full_name || 'Ismi sir'}\n💳 Rekvizit: <code>${payment.payment_details}</code>\n💰 Summa: <b>${payment.amount} so'm</b>\n\n🤖 Bizning bot: @${ctx.me.username}`;
    try {
      await ctx.api.sendMessage(ENV.PAYMENT_CHANNEL_ID, channelMsg, { parse_mode: 'HTML' });
    } catch (e) {
      await ctx.api.sendMessage(ENV.ADMIN_ID, "⚠️ Kanalga xabar yuborishda xatolik! Bot kanalga admin qilinmagan yoki kanal ID si noto'g'ri.");
    }
  }
});

// Rejecting payment
bot.callbackQuery(/^pay_reject_(.+)$/, async (ctx) => {
  if (!ctx.from) return;
  if (!await hasPermission(ctx.from.id, 'can_approve_payments')) return ctx.answerCallbackQuery({ text: "Sizda ruxsat yo'q!", show_alert: true });

  const payId = ctx.match[1];
  
  const { data: payment } = await supabase.from('withdrawals').select('*').eq('id', payId).single();
  if (!payment || payment.status !== 'pending') return ctx.answerCallbackQuery("Allaqachon ko'rib chiqilgan yoki topilmadi");

  await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', payId);
  
  // Refund balance
  const { data: user } = await supabase.from('users').select('*').eq('telegram_id', payment.user_id).single();
  if (user) {
    await supabase.from('users').update({ balance: user.balance + payment.amount }).eq('telegram_id', user.telegram_id);
  }

  await ctx.editMessageText(ctx.callbackQuery.message?.text + '\n\n❌ Rad etildi (Pul qaytarildi)');
  await ctx.answerCallbackQuery('Rad etildi.');
  
  try {
    await ctx.api.sendMessage(payment.user_id, `❌ Pul yechish so'rovingiz rad etildi. Mablag' hisobingizga qaytarildi.`);
  } catch (e) {}
});

bot.command('admin', async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;

  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: votedCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_voted', true);
  
  await ctx.reply(
    `📊 <b>Admin Statistika</b>\n\n` +
    `👥 Jami foydalanuvchilar: ${usersCount || 0}\n` +
    `✅ Ovoz berganlar: ${votedCount || 0}\n\n` +
    `Xabar yuborish uchun: /broadcast xabar matni\n` +
    `Sozlamalarni o'zgartirish uchun: /settings`,
    { parse_mode: 'HTML' }
  );
});

import { InlineKeyboard } from 'grammy';

bot.command('settings', async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;

  const kb = new InlineKeyboard()
    .text(`Minimal to'lov (Hozir: ${ENV.MIN_WITHDRAW_AMOUNT})`, 'settings_min_withdraw').row()
    .text(`Ovoz berish uchun (Hozir: ${ENV.VOTE_REWARD})`, 'settings_vote_reward').row()
    .text(`Referal uchun (Hozir: ${ENV.REF_REWARD})`, 'settings_ref_reward');
    
  await ctx.reply("⚙️ <b>Sozlamalar paneli</b>\nQaysi qiymatni o'zgartirmoqchisiz?", { parse_mode: 'HTML', reply_markup: kb });
});

bot.command('broadcast', async (ctx) => {
  if (!ctx.from) return;
  if (!await hasPermission(ctx.from.id, 'can_broadcast')) return;
  
  const msg = ctx.match;
  if (!msg) return ctx.reply('Xabar matnini kiriting. Masalan: /broadcast Hammaga salom!');

  const { data: users } = await supabase.from('users').select('telegram_id');
  if (!users) return ctx.reply('Foydalanuvchilar topilmadi.');

  let sent = 0;
  for (const u of users) {
    try {
      await ctx.api.sendMessage(u.telegram_id, msg);
      sent++;
    } catch (e) {}
  }

  await ctx.reply(`Xabar ${sent} ta foydalanuvchiga yuborildi.`);
});

import { updateEnvVariable } from '../utils/envUpdater';

bot.command('setchannel', async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const channelId = ctx.match.trim();
  if (!channelId) {
    return ctx.reply("Iltimos, kanal ID sini yoki username sini kiriting.\nMasalan: /setchannel @mening_kanalim yoki /setchannel -1001234567890\n\nDiqqat: Bot o'sha kanalga admin qilingan bo'lishi shart!");
  }
  updateEnvVariable('PAYMENT_CHANNEL_ID', channelId);
  await ctx.reply(`✅ Kanal muvaffaqiyatli saqlandi: ${channelId}\n\nEndi to'lovlar tasdiqlanganda ushbu kanalga avtomatik xabar yuboriladi.`);
});
