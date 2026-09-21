require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 Bot Started!');
});

// Health check endpoint - Railway ke liye zaruri!
app.get('/', (req, res) => {
  res.send('Bot running ✅');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Telegram bot polling active');
});