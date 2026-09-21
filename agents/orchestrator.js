require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const ideator = require('./agents/ideator');
const hookScript = require('./agents/hook-script');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_USER_ID = parseInt(process.env.TELEGRAM_USER_ID);

const bot = new TelegramBot(TOKEN, { 
  polling: { interval: 2000, autoStart: true }
});

const pendingIdeas = new Map();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🚀 SSA Bot Started!');
  generateIdeas(chatId);
});

bot.on('callback_query', (query) => {
  const [action, ideaId] = query.data.split('_');
  if (action === 'approve') {
    approveIdea(query.from.id, ideaId, query.id);
  }
});

async function generateIdeas(chatId) {
  const ideas = ideator.generateIdeas(5);
  for (const idea of ideas) {
    pendingIdeas.set(idea.id, idea);
    await bot.sendMessage(chatId, `${idea.title}`, {
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Approve', callback_data: `approve_${idea.id}` }
        ]]
      }
    });
  }
}

async function approveIdea(chatId, ideaId, queryId) {
  const idea = pendingIdeas.get(ideaId);
  if (!idea) return;
  
  bot.answerCallbackQuery(queryId, { text: '✅ Approved!' });
  const caption = hookScript.generateCaption(idea);
  await bot.sendMessage(chatId, `Caption:\n${caption}`);
  pendingIdeas.delete(ideaId);
}

console.log('✅ Bot running...');