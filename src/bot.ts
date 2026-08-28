import { Bot, Context, session, SessionFlavor } from 'grammy';
import { type ConversationFlavor, conversations } from '@grammyjs/conversations';
// @ts-ignore
import { supabaseAdapter } from '@grammyjs/storage-supabase';
import { supabase } from './database';
import { ENV } from './config';

export interface SessionData {
  settingKeyToChange?: string;
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

if (!ENV.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is missing');
}

export const bot = new Bot<MyContext>(ENV.BOT_TOKEN);

// Bot qotmasligi, serverless (Vercel) muhitda yoki qayta ishga tushganda 
// userlarning kiritayotgan ma'lumotlari (conversation) o'chib ketmasligi uchun Supabase storage
bot.use(
  session({
    initial: () => ({}),
    storage: supabaseAdapter({
      supabase,
      table: 'sessions', // Supabase'dagi jadval
    }),
  })
);

bot.use(conversations());
