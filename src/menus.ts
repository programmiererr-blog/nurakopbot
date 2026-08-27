import { Keyboard, InlineKeyboard } from 'grammy';

export const contactKeyboard = new Keyboard()
  .requestContact("📱 Telefon raqamni yuborish")
  .resized()
  .oneTime();

export const mainKeyboard = new Keyboard()
  .text("🗳 Ovoz berish").text("🔗 Referal havola").row()
  .text("💰 Balans").text("📥 Pulni yechib olish").row()
  .text("🔄 Ovozni tekshirish").text("🎉 Aksiyalar").row()
  .text("💸 To'lovlar isboti")
  .resized();

export const voteInlineKeyboard = new InlineKeyboard()
  .url("🗳 Ochiq byudjetda Ovoz berish", "https://t.me/openbudget_official_1_bot?start=055514963004");
