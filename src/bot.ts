import { Bot, Context, session, SessionFlavor } from 'grammy';
import { type ConversationFlavor, conversations } from '@grammyjs/conversations';
import { ENV } from './config';

export interface SessionData {
  settingKeyToChange?: string;
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

if (!ENV.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is missing');
}

export const bot = new Bot<MyContext>(ENV.BOT_TOKEN);

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
