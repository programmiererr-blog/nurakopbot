import { bot } from '../bot';
import { getUser, createUser, updatePhone } from '../database';
import { contactKeyboard, mainKeyboard } from '../menus';

bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const payload = ctx.match;
  let referredBy = payload ? parseInt(payload) : undefined;
  if (referredBy === telegramId) referredBy = undefined; // Cant refer self

  let user = await getUser(telegramId);

  if (!user) {
    user = await createUser(telegramId, ctx.from?.first_name || '', ctx.from?.username, referredBy);
  }

  if (!user?.phone_number) {
    await ctx.reply("Assalomu alaykum! Botdan foydalanish uchun telefon raqamingizni tasdiqlashingiz kerak.", {
      reply_markup: contactKeyboard
    });
  } else {
    await ctx.reply("Asosiy menyu:", { reply_markup: mainKeyboard });
  }
});

bot.on('message:contact', async (ctx) => {
  const contact = ctx.message.contact;
  const telegramId = ctx.from.id;

  if (contact.user_id !== telegramId) {
    return ctx.reply("Iltimos, faqat o'zingizning telefon raqamingizni yuboring!", {
      reply_markup: contactKeyboard
    });
  }

  await updatePhone(telegramId, contact.phone_number);

  const instructionMsg = `✅ <b>Raqamingiz muvaffaqiyatli saqlandi!</b>\n\n` +
    `ℹ️ <b>Botdan qanday foydalanish mumkin?</b>\n` +
    `1️⃣ <b>"🗳 Ovoz berish"</b> tugmasini bosing va Ochiq byudjet rasmiy botiga o'tib ovoz bering.\n` +
    `2️⃣ Ovoz berish muvaffaqiyatli yakunlangach, rasmiy botdan kelgan <b>tasdiqlovchi xabarni (skrinshot) rasmga oling</b>.\n` +
    `3️⃣ Ushbu botga qaytib, <b>"🔄 Ovozni tekshirish"</b> tugmasini bosing va olingan skrinshotni bizga yuboring.\n\n` +
    `Adminlarimiz rasmni tekshirgandan so'ng, hisobingizga bonus pullari tushadi! Asosiy menyuga xush kelibsiz 👇`;

  await ctx.reply(instructionMsg, {
    parse_mode: 'HTML',
    reply_markup: mainKeyboard
  });
});
