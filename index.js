require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { generateIdeas } = require('./agents/ideator');
const { createCompletePost } = require('./agents/hook-script');

const app = express();
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const DATA_FILE = path.join(__dirname, 'data', 'ideas.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return { sessions: {} };
}

function saveData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🚀 Bot Started!');
});

bot.onText(/\/ideas/, async (msg) => {
  try {
    const ideas = await generateIdeas(5);
    const sessionId = `session_${msg.chat.id}_${Date.now()}`;
    const data = loadData();
    
    data.sessions[sessionId] = {
      createdAt: new Date().toISOString(),
      userId: msg.chat.id,
      ideas: ideas,
      approved: null,
      approvedAt: null
    };
    
    saveData(data);
    
    let response = '📝 **5 Content Ideas:**\n\n';
    ideas.forEach((idea, i) => {
      response += `${i+1}. ${idea.title}\n   📌 Type: ${idea.type}\n\n`;
    });
    
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Idea 1', callback_data: `approve_0_${sessionId}` }, { text: '❌ Reject', callback_data: `reject_0_${sessionId}` }],
          [{ text: '✅ Idea 2', callback_data: `approve_1_${sessionId}` }, { text: '❌ Reject', callback_data: `reject_1_${sessionId}` }],
          [{ text: '✅ Idea 3', callback_data: `approve_2_${sessionId}` }, { text: '❌ Reject', callback_data: `reject_2_${sessionId}` }],
          [{ text: '✅ Idea 4', callback_data: `approve_3_${sessionId}` }, { text: '❌ Reject', callback_data: `reject_3_${sessionId}` }],
          [{ text: '✅ Idea 5', callback_data: `approve_4_${sessionId}` }, { text: '❌ Reject', callback_data: `reject_4_${sessionId}` }]
        ]
      }
    };
    
    bot.sendMessage(msg.chat.id, response, opts);
  } catch (error) {
    console.error(error);
    bot.sendMessage(msg.chat.id, '❌ Error generating ideas');
  }
});

bot.on('callback_query', async (query) => {
  const data_loaded = loadData();
  const chatId = query.message.chat.id;
  const parts = query.data.split('_');
  const action = parts[0];
  const ideaIndex = parseInt(parts[1]);
  const sessionId = parts.slice(2).join('_');
  const sessionData = data_loaded.sessions[sessionId];
  
  if (!sessionData) {
    bot.sendMessage(chatId, '❌ Session expired. Generate new ideas with /ideas');
    bot.answerCallbackQuery(query.id);
    return;
  }
  
  if (action === 'approve') {
    try {
      const approvedIdea = sessionData.ideas[ideaIndex];
      
      // Step 1: Generate Caption
      const post = await createCompletePost(approvedIdea, 'instagram');
      bot.sendMessage(chatId, `🎨 Generating image & posting to Instagram...`);
      
      // Step 2: Generate Image with DALL-E
      const { generateImage } = require('./agents/openai-image-generator');
      const imageUrl = await generateImage(post.caption);
      
      // Step 3: Publish to Instagram
      const { publishToInstagram } = require('./agents/publisher');
      const postId = await publishToInstagram(imageUrl, post.caption, post.hashtags);
      
      // Step 4: Update Data
      data_loaded.sessions[sessionId].approved = {
        ideaIndex: ideaIndex,
        ideaTitle: approvedIdea.title,
        caption: post.caption,
        hashtags: post.hashtags,
        imageUrl: imageUrl,
        instagramPostId: postId
      };
      data_loaded.sessions[sessionId].approvedAt = new Date().toISOString();
      saveData(data_loaded);
      
      // Step 5: Send Confirmation
      const responseText = `✅ **Idea ${ideaIndex + 1} Posted to Instagram!**\n\n📝 **Caption:**\n${post.caption}\n\n#️⃣ **Hashtags:**\n${post.hashtags}\n\n🔗 **Post ID:** ${postId}`;
      bot.sendMessage(chatId, responseText);
    } catch (error) {
      console.error('Approval error:', error);
      bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
    bot.answerCallbackQuery(query.id);
  } else if (action === 'reject') {
    bot.sendMessage(chatId, `❌ Idea ${ideaIndex + 1} rejected. Generate new ideas with /ideas`);
    bot.answerCallbackQuery(query.id);
  }
});

app.get('/', (req, res) => {
  res.send('Bot running ✅');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Telegram bot polling active');
});