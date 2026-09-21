require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

console.log('✅ Bot starting...');

bot.onText(/\/start/, (msg) => {
  console.log('Received /start');
  const ideas = [
    { id: '1', title: 'How SEO changed in 2026', type: 'reel' },
    { id: '2', title: 'Social media tips', type: 'carousel' },
    { id: '3', title: 'Content strategy 101', type: 'image' }
  ];
  
  bot.sendMessage(msg.chat.id, '🚀 Bot Started!\n\n📌 Ideas Generated:');
  
  ideas.forEach(idea => {
    setTimeout(() => {
      bot.sendMessage(msg.chat.id, 
        `\n✅ ${idea.title}\n🎬 ${idea.type}`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: 'Approve', callback_data: `approve_${idea.id}` }
            ]]
          }
        }
      );
    }, 500);
  });
});

bot.on('callback_query', (q) => {
  bot.answerCallbackQuery(q.id, { text: 'Noted!' });
});

console.log('✅ Bot ready!');