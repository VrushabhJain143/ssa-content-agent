require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const ideator = require('./agents/ideator');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_USER_ID = parseInt(process.env.TELEGRAM_USER_ID);

const bot = new TelegramBot(TOKEN, { 
  polling: { 
    interval: 2000,
    autoStart: true
  } 
});

const pendingIdeas = new Map();

console.log('✅ Bot starting...');

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`✅ /start from ${chatId}`);
  
  try {
    await bot.sendMessage(chatId, '🚀 SSA Content Agent Started!\n\nGenerating ideas...');
    
    // Generate 5 ideas
    const ideas = ideator.generateIdeas(5);
    console.log(`Generated ${ideas.length} ideas`);
    
    for (const idea of ideas) {
      pendingIdeas.set(idea.id, idea);
      
      await bot.sendMessage(chatId, 
        `📌 ${idea.title}\n🎬 Type: ${idea.type}\n\nID: ${idea.id}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve', callback_data: `approve_${idea.id}` },
                { text: '❌ Reject', callback_data: `reject_${idea.id}` }
              ]
            ]
          }
        }
      );
      
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
});

// Callback handler
bot.on('callback_query', async (query) => {
  console.log('Callback:', query.data);
  bot.answerCallbackQuery(query.id, { text: '✅ Noted!' });
});

console.log('✅ SSA Bot running...');