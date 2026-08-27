import { bot } from '../bot';
import { getUser, getReferralsCount } from '../database';
import { mainKeyboard, voteInlineKeyboard } from '../menus';

bot.hears('🗳 Ovoz berish', async (ctx) => {
  await ctx.reply("Ovoz berish uchun quyidagi tugmani bosing va OpenBudget botiga o'ting:\n\nQo'llanma: Botga kirgach, raqamingizni yuboring va ovoz bering.", {
    reply_markup: voteInlineKeyboard
  });
});

bot.hears('🔗 Referal havola', async (ctx) => {
  const botInfo = await ctx.api.getMe();
  const link = `https://t.me/${botInfo.username}?start=${ctx.from?.id}`;
  await ctx.reply(`Sizning shaxsiy referal havolangiz:\n\n${link}\n\nHar bir taklif qilingan va ovoz bergan do'stingiz uchun bonus olasiz!`);
});

bot.hears('💰 Balans', async (ctx) => {
  if (!ctx.from) return;
  const user = await getUser(ctx.from.id);
  if (!user) return;

  const refsCount = await getReferralsCount(ctx.from.id);
  
  await ctx.reply(
    `💰 Sizning balansingiz: ${user.balance} so'm\n` +
    `👥 Taklif qilingan do'stlar: ${refsCount} ta\n` +
    `🗳 Ovoz holati: ${user.is_voted ? 'Tasdiqlangan ✅' : 'Tasdiqlanmagan ❌'}`
  );
});

bot.hears('🎉 Aksiyalar', async (ctx) => {
  await ctx.reply("Hozirda quyidagi aksiyalar mavjud: ..."); // Add your promo text here
});

import { InlineKeyboard } from 'grammy';

bot.hears("💸 To'lovlar isboti", async (ctx) => {
  const inlineKb = new InlineKeyboard()
    .url("💸 To'lovlar kanali", "https://t.me/+z0ZbeCtQoZJjODEy");
  await ctx.reply("Barcha to'lovlar isboti bizning maxsus kanalimizda joylab boriladi. Kanalga o'tish uchun quyidagi tugmani bosing:", { reply_markup: inlineKb });
});
