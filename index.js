require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { generateIdeas } = require('./agents/ideator');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Bot ka /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 Bot Started!');
});

// Bot ka /ideas command
bot.onText(/\/ideas/, async (msg) => {
  try {
    const ideas = await generateIdeas(5);
    let response = '📝 **5 Content Ideas:**\n\n';
    ideas.forEach((idea, i) => {
      response += `${i+1}. ${idea}\n\n`;
    });
    bot.sendMessage(msg.chat.id, response);
  } catch (error) {
    bot.sendMessage(msg.chat.id, '❌ Error generating ideas');
  }
});

// Express health check
app.get('/', (req, res) => {
  res.send('Bot running ✅');
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Telegram bot polling active');
});