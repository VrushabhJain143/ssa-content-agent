require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { generateIdeas } = require('./agents/ideator');
const { createCompletePost } = require('./agents/hook-script');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Store ideas in memory
let currentIdeas = [];

// Bot ka /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 Bot Started!');
});

// Bot ka /ideas command
bot.onText(/\/ideas/, async (msg) => {
  try {
    const ideas = await generateIdeas(5);
    currentIdeas = ideas; // Store for later
    
    let response = '📝 **5 Content Ideas:**\n\n';
    ideas.forEach((idea, i) => {
      response += `${i+1}. ${idea.title}\n   📌 Type: ${idea.type}\n\n`;
    });
    
    // Add approval buttons for ALL 5 ideas
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Idea 1', callback_data: `approve_0` },
            { text: '❌ Reject', callback_data: `reject_0` }
          ],
          [
            { text: '✅ Idea 2', callback_data: `approve_1` },
            { text: '❌ Reject', callback_data: `reject_1` }
          ],
          [
            { text: '✅ Idea 3', callback_data: `approve_2` },
            { text: '❌ Reject', callback_data: `reject_2` }
          ],
          [
            { text: '✅ Idea 4', callback_data: `approve_3` },
            { text: '❌ Reject', callback_data: `reject_3` }
          ],
          [
            { text: '✅ Idea 5', callback_data: `approve_4` },
            { text: '❌ Reject', callback_data: `reject_4` }
          ]
        ]
      }
    };
    
    bot.sendMessage(msg.chat.id, response, opts);
  } catch (error) {
    console.error(error);
    bot.sendMessage(msg.chat.id, '❌ Error generating ideas');
  }
});

// Handle button clicks
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  
  if (data.startsWith('approve_')) {
    try {
      const ideaIndex = parseInt(data.split('_')[1]);
      const approvedIdea = currentIdeas[ideaIndex];
      
      // Generate caption and hashtags
      const post = await createCompletePost(approvedIdea, 'instagram');
      
      const responseText = `✅ **Idea ${ideaIndex + 1} Approved!**\n\n📝 **Caption:**\n${post.caption}\n\n#️⃣ **Hashtags:**\n${post.hashtags}`;
      bot.sendMessage(chatId, responseText);
    } catch (error) {
      const ideaIndex = parseInt(data.split('_')[1]);
      const approvedIdea = currentIdeas[ideaIndex];
      bot.sendMessage(chatId, `✅ Idea ${ideaIndex + 1} approved: ${approvedIdea.title}\n\n📝 Type: ${approvedIdea.type}`);
    }
    bot.answerCallbackQuery(query.id);
  } else if (data.startsWith('reject_')) {
    const ideaIndex = parseInt(data.split('_')[1]);
    bot.sendMessage(chatId, `❌ Idea ${ideaIndex + 1} rejected. Generate new ideas with /ideas`);
    bot.answerCallbackQuery(query.id);
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