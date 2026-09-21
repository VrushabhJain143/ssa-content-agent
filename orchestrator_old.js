const axios = require('axios');
require('dotenv').config();
const ideator = require('./agents/ideator');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const USER_ID = process.env.TELEGRAM_USER_ID;
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL) || 2000;
const TELEGRAM_API = 'https://api.telegram.org/bot' + BOT_TOKEN;

let lastUpdateId = 0;
const pendingApprovals = new Map();

async function sendIdeaForApproval(idea) {
  try {
    const payload = {
      chat_id: USER_ID,
      text: 'New Idea for Approval\n\n' + idea.title + '\n\nType: ' + idea.type + '\nID: ' + idea.id,
      reply_markup: {
        inline_keyboard: [[
          { text: 'Approve', callback_data: 'approve_' + idea.id },
          { text: 'Reject', callback_data: 'reject_' + idea.id }
        ]]
      }
    };

    const response = await axios.post(TELEGRAM_API + '/sendMessage', payload);
    const messageId = response.data.result.message_id;
    
    pendingApprovals.set(idea.id, {
      status: 'pending',
      messageId,
      idea,
      sentAt: new Date()
    });
    
    console.log('Idea sent: ' + idea.title);
    return { messageId, ideaId: idea.id };
  } catch (error) {
    console.error('Failed to send idea:', error.message);
  }
}

async function startPolling() {
  console.log('Ideator bot started. Polling...\n');
  
  while (true) {
    try {
      const response = await axios.get(TELEGRAM_API + '/getUpdates', {
        params: { offset: lastUpdateId + 1 }
      });

      const updates = response.data.result || [];
      
      for (const update of updates) {
        lastUpdateId = update.update_id;

        if (update.callback_query) {
          const data = update.callback_query.data;
          const callbackId = update.callback_query.id;
          const [action, ideaId] = data.split('_');

          const approval = pendingApprovals.get(ideaId);
          if (!approval) continue;

          if (action === 'approve') {
            approval.status = 'approved';
            console.log('APPROVED: ' + approval.idea.title);
            
            await axios.post(TELEGRAM_API + '/answerCallbackQuery', {
              callback_query_id: callbackId,
              text: 'Approved!',
              show_alert: false
            });
          } else if (action === 'reject') {
            approval.status = 'rejected';
            console.log('REJECTED: ' + approval.idea.title);
            
            await axios.post(TELEGRAM_API + '/answerCallbackQuery', {
              callback_query_id: callbackId,
              text: 'Rejected',
              show_alert: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Poll error:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
}

async function main() {
  console.log('\nIDEATOR + TELEGRAM - LIVE\n');

  startPolling();
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Generating 5 ideas...\n');
  const ideas = ideator.generateIdeas(5);

  for (const idea of ideas) {
    try {
      await sendIdeaForApproval(idea);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  console.log('\nAll ideas sent to Telegram!');
  console.log('Waiting for approvals...\n');

  await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000));
}

main().catch(console.error);
