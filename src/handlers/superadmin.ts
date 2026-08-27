import { InlineKeyboard } from 'grammy';
import { bot, MyContext } from '../bot';
import { supabase } from '../database';
import { ENV } from '../config';

bot.command('admins', async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;

  const { data: admins } = await supabase.from('admins').select('*');
  
  if (!admins || admins.length === 0) {
    await ctx.reply("Hali yordamchi adminlar yo'q. Yangi qo'shish uchun: /addadmin ID");
    return;
  }

  let text = "👥 <b>Yordamchi adminlar ro'yxati:</b>\n\n";
  admins.forEach((admin, index) => {
    text += `${index + 1}. ID: <code>${admin.telegram_id}</code>\n`;
    text += `   - Ovoz tasdiqlash: ${admin.can_approve_proofs ? '✅' : '❌'}\n`;
    text += `   - To'lov tasdiqlash: ${admin.can_approve_payments ? '✅' : '❌'}\n`;
    text += `   - Xabar yuborish: ${admin.can_broadcast ? '✅' : '❌'}\n\n`;
  });

  text += "Yangi admin qo'shish uchun: /addadmin ID";
  
  const kb = new InlineKeyboard();
  admins.forEach(admin => {
    kb.text(`⚙️ Sozlash: ${admin.telegram_id}`, `edit_admin_${admin.telegram_id}`).row();
  });

  await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
});

bot.command('addadmin', async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const match = ctx.match.trim();
  const telegramId = parseInt(match);
  
  if (!match || isNaN(telegramId)) {
    return ctx.reply("Iltimos, foydalanuvchi ID sini kiriting: /addadmin 123456789");
  }

  const { error } = await supabase.from('admins').insert([{ telegram_id: telegramId }]);
  if (error) {
    if (error.code === '23505') { // unique violation
      return ctx.reply("Bu foydalanuvchi allaqachon admin!");
    }
    return ctx.reply("Xatolik yuz berdi.");
  }

  await ctx.reply(`✅ Admin muvaffaqiyatli qo'shildi: ${telegramId}\n\nUnga ruxsat berish uchun /admins orqali sozlamalarga kiring.`);
});

bot.callbackQuery(/^edit_admin_(.+)$/, async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const adminId = parseInt(ctx.match[1]);

  const { data: admin } = await supabase.from('admins').select('*').eq('telegram_id', adminId).single();
  if (!admin) return ctx.answerCallbackQuery("Topilmadi");

  const kb = new InlineKeyboard()
    .text(`Ovozlar: ${admin.can_approve_proofs ? '✅' : '❌'}`, `toggle_proofs_${adminId}`).row()
    .text(`To'lovlar: ${admin.can_approve_payments ? '✅' : '❌'}`, `toggle_payments_${adminId}`).row()
    .text(`Xabarlar: ${admin.can_broadcast ? '✅' : '❌'}`, `toggle_broadcast_${adminId}`).row()
    .text("🗑 O'chirish", `delete_admin_${adminId}`).row()
    .text("🔙 Orqaga", "back_to_admins");

  await ctx.editMessageText(`⚙️ <b>Adminni sozlash:</b> <code>${adminId}</code>`, { parse_mode: 'HTML', reply_markup: kb });
});

bot.callbackQuery(/^toggle_(.+)_(\d+)$/, async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const type = ctx.match[1];
  const adminId = parseInt(ctx.match[2]);

  let field = '';
  if (type === 'proofs') field = 'can_approve_proofs';
  else if (type === 'payments') field = 'can_approve_payments';
  else if (type === 'broadcast') field = 'can_broadcast';
  else return;

  const { data: admin } = await supabase.from('admins').select('*').eq('telegram_id', adminId).single();
  if (!admin) return;

  await supabase.from('admins').update({ [field]: !admin[field] }).eq('telegram_id', adminId);
  
  // Refresh panel
  const { data: updatedAdmin } = await supabase.from('admins').select('*').eq('telegram_id', adminId).single();
  
  const kb = new InlineKeyboard()
    .text(`Ovozlar: ${updatedAdmin.can_approve_proofs ? '✅' : '❌'}`, `toggle_proofs_${adminId}`).row()
    .text(`To'lovlar: ${updatedAdmin.can_approve_payments ? '✅' : '❌'}`, `toggle_payments_${adminId}`).row()
    .text(`Xabarlar: ${updatedAdmin.can_broadcast ? '✅' : '❌'}`, `toggle_broadcast_${adminId}`).row()
    .text("🗑 O'chirish", `delete_admin_${adminId}`).row()
    .text("🔙 Orqaga", "back_to_admins");

  await ctx.editMessageReplyMarkup({ reply_markup: kb }).catch(() => {});
  await ctx.answerCallbackQuery("O'zgartirildi!");
});

bot.callbackQuery(/^delete_admin_(\d+)$/, async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const adminId = parseInt(ctx.match[1]);

  await supabase.from('admins').delete().eq('telegram_id', adminId);
  await ctx.editMessageText(`✅ Admin o'chirildi: ${adminId}`);
});

bot.callbackQuery("back_to_admins", async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const { data: admins } = await supabase.from('admins').select('*');
  let text = "👥 <b>Yordamchi adminlar ro'yxati:</b>\n\n";
  admins?.forEach((admin, index) => {
    text += `${index + 1}. ID: <code>${admin.telegram_id}</code>\n`;
    text += `   - Ovoz tasdiqlash: ${admin.can_approve_proofs ? '✅' : '❌'}\n`;
    text += `   - To'lov tasdiqlash: ${admin.can_approve_payments ? '✅' : '❌'}\n`;
    text += `   - Xabar yuborish: ${admin.can_broadcast ? '✅' : '❌'}\n\n`;
  });

  const kb = new InlineKeyboard();
  admins?.forEach(admin => {
    kb.text(`⚙️ Sozlash: ${admin.telegram_id}`, `edit_admin_${admin.telegram_id}`).row();
  });

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
});
