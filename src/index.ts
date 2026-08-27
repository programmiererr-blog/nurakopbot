import { bot } from './bot';

import './handlers/start';
import './handlers/menu';
import './handlers/conversations';
import './handlers/admin';
import './handlers/superadmin';

bot.catch((err) => {
  console.error('Error in bot:', err);
});

async function start() {
  console.log('Bot is starting...');
  await bot.start();
}

start();
