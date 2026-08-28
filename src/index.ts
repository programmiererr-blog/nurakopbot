import { webhookCallback } from 'grammy';
import { bot } from './bot';

import './handlers/start';
import './handlers/menu';
import './handlers/conversations';
import './handlers/admin';
import './handlers/superadmin';

// Xatoliklarni ushlash va bot qotib qolishining oldini olish
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[Error] Update ID: ${ctx.update.update_id}`);
  const e = err.error;
  if (e instanceof Error) {
    console.error(`[Error Message]: ${e.message}`);
    console.error(e.stack);
  } else {
    console.error('Noma\'lum xatolik:', e);
  }
});

// Vercel serverless (Webhook) muhitini tekshirish
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

if (!isVercel) {
  // Local yoki VPS (Long Polling) muhitida ishga tushirish
  const startPolling = async () => {
    try {
      console.log('Bot Long Polling rejimida ishga tushmoqda...');
      await bot.start({
        // Eski, javobsiz qolib ketgan xabarlarni o'tkazib yuborish (bot qotmasligi uchun)
        drop_pending_updates: true,
        onStart: (botInfo) => {
          console.log(`Bot muvaffaqiyatli ishga tushdi: @${botInfo.username}`);
        },
      });
    } catch (error) {
      console.error('Long Polling ishga tushishida xatolik:', error);
    }
  };
  startPolling();
}

// Vercel uchun Webhook handler'ni eksport qilish
export default webhookCallback(bot, 'http');
