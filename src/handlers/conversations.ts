import { Conversation, createConversation } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { MyContext, bot } from '../bot';
import { supabase, getUser, getNotifiableAdmins } from '../database';
import { ENV } from '../config';
import { mainKeyboard } from '../menus';

type MyConversation = Conversation<MyContext>;

export async function withdrawConversation(conversation: MyConversation, ctx: MyContext) {
  const user = await conversation.external(() => getUser(ctx.from!.id));
  if (!user || user.balance < ENV.MIN_WITHDRAW_AMOUNT) {
    await ctx.reply(`Pul yechish uchun minimal summa: ${ENV.MIN_WITHDRAW_AMOUNT} so'm. Sizning balansingiz: ${user?.balance || 0} so'm.`);
    return;
  }

  await ctx.reply("Karta raqamingizni yoki telefon raqamingizni yuboring:", { reply_markup: { remove_keyboard: true } });
  const { message } = await conversation.waitFor('message:text');
  
  if (!message || !message.text) return;
  const paymentDetails = message.text;

  const { data, error } = await conversation.external(() => 
    supabase.from('withdrawals').insert([{
      user_id: ctx.from!.id,
      amount: user.balance,
      payment_details: paymentDetails
    }]).select().single()
  );

  if (error || !data) {
    console.error("Supabase Error in withdrawals insert:", error);
    await ctx.reply("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.", { reply_markup: mainKeyboard });
    return;
  }

  await conversation.external(() => 
    supabase.from('users').update({ balance: 0 }).eq('telegram_id', ctx.from!.id)
  );

  await ctx.reply("So'rovingiz adminga yuborildi. Tez orada ko'rib chiqiladi.", { reply_markup: mainKeyboard });

  const adminKb = new InlineKeyboard()
    .text("✅ To'landi", `pay_approve_${data.id}`).text("❌ Rad etildi", `pay_reject_${data.id}`);
  
  const admins = await conversation.external(() => getNotifiableAdmins('can_approve_payments'));
  
  for (const adminId of admins) {
    await ctx.api.sendMessage(adminId, 
      `📥 <b>Yangi pul yechish so'rovi!</b>\n\nID: ${ctx.from!.id}\nIsm: ${user.full_name}\nTelefon: ${user.phone_number}\n\nSumma: ${user.balance} so'm\nRekvizitlar: ${paymentDetails}`,
      { parse_mode: 'HTML', reply_markup: adminKb }
    ).catch(() => {});
  }
}

export async function proofConversation(conversation: MyConversation, ctx: MyContext) {
  const user = await conversation.external(() => getUser(ctx.from!.id));
  if (user?.is_voted) {
    await ctx.reply("Siz allaqachon ovoz bergansiz va tasdiqlangansiz!");
    return;
  }

  await ctx.reply("Iltimos, ovoz berganingiz haqidagi skrinshotni (rasmni) yuboring:", { reply_markup: { remove_keyboard: true } });
  const { message } = await conversation.waitFor('message:photo');
  
  if (!message || !message.photo) return;
  const photo = message.photo[message.photo.length - 1];

  const { data, error } = await conversation.external(() => 
    supabase.from('vote_proofs').insert([{
      user_id: ctx.from!.id,
      photo_file_id: photo.file_id
    }]).select().single()
  );

  if (error || !data) {
    console.error("Supabase Error in vote_proofs insert:", error);
    await ctx.reply("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.", { reply_markup: mainKeyboard });
    return;
  }

  await ctx.reply("Skrinshot qabul qilindi. Adminlar tekshirib chiqqandan so'ng hisobingizga pul tushadi.", { reply_markup: mainKeyboard });

  if (user?.referred_by) {
    await ctx.api.sendMessage(user.referred_by, `⏳ Siz taklif qilgan foydalanuvchi (${user.full_name || "do'stingiz"}) ovoz berdi va skrinshot yubordi.\nAdmin tasdiqlagandan so'ng sizga bonus taqdim etiladi!`).catch(() => {});
  }

  const adminKb = new InlineKeyboard()
    .text("✅ Tasdiqlash", `proof_approve_${data.id}`).text("❌ Rad etish", `proof_reject_${data.id}`);

  const admins = await conversation.external(() => getNotifiableAdmins('can_approve_proofs'));

  for (const adminId of admins) {
    await ctx.api.sendPhoto(adminId, photo.file_id, {
      caption: `🔄 <b>Yangi ovoz skrinshoti!</b>\n\nID: ${ctx.from!.id}\nIsm: ${user?.full_name}\nTelefon: ${user?.phone_number}`,
      parse_mode: 'HTML',
      reply_markup: adminKb
    }).catch(() => {});
  }
}

bot.use(createConversation(withdrawConversation));
bot.use(createConversation(proofConversation));

import { updateEnvVariable } from '../utils/envUpdater';
import { updateSetting } from '../database';

export async function settingsConversation(conversation: MyConversation, ctx: MyContext) {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const key = ctx.session.settingKeyToChange as keyof typeof ENV;
  
  await ctx.reply("Yangi summani raqamlarda kiriting:");
  const { message } = await conversation.waitFor('message:text');
  
  if (!message || !message.text) return;
  
  const newValue = parseInt(message.text);
  if (isNaN(newValue) || newValue < 0) {
    await ctx.reply("Noto'g'ri qiymat kiritildi. Bekor qilindi.");
    return;
  }
  
  await conversation.external(() => {
    updateEnvVariable(key, newValue);
  });
  
  await ctx.reply(`Muvaffaqiyatli o'zgartirildi: ${key} = ${newValue}`);
}

export async function aksiyaConversation(conversation: MyConversation, ctx: MyContext) {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  
  await ctx.reply("Aksiyalar uchun yangi matnni yuboring (HTML format ishlata olasiz):", {
    reply_markup: { remove_keyboard: true }
  });
  
  const { message } = await conversation.waitFor('message:text');
  if (!message || !message.text) {
    await ctx.reply("Matn kiritilmadi. Bekor qilindi.", { reply_markup: mainKeyboard });
    return;
  }
  
  await conversation.external(() => updateSetting('aksiyalar_text', message.text!));
  await ctx.reply("Aksiyalar matni muvaffaqiyatli yangilandi!", { reply_markup: mainKeyboard });
}

bot.use(createConversation(settingsConversation));
bot.use(createConversation(aksiyaConversation));

bot.callbackQuery(/^settings_(.+)$/, async (ctx) => {
  if (ctx.from?.id !== ENV.ADMIN_ID) return;
  const keyMap: Record<string, string> = {
    'min_withdraw': 'MIN_WITHDRAW_AMOUNT',
    'vote_reward': 'VOTE_REWARD',
    'ref_reward': 'REF_REWARD'
  };
  
  const setting = ctx.match[1];
  const envKey = keyMap[setting];
  if (!envKey) return;
  
  ctx.session.settingKeyToChange = envKey;
  await ctx.conversation.enter('settingsConversation');
  await ctx.answerCallbackQuery();
});

bot.hears("📥 Pulni yechib olish", async (ctx) => {
  await ctx.conversation.enter('withdrawConversation');
});

bot.hears("🔄 Ovozni tekshirish", async (ctx) => {
  await ctx.conversation.enter('proofConversation');
});
