const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const USER_ID = process.env.TELEGRAM_USER_ID;
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL) || 2000;

const TELEGRAM_API = https://api.telegram.org/bot+BOT_TOKEN;
let lastUpdateId = 0;
const pendingApprovals = new Map();

async function sendForApproval(draft) {
  try {
    const messageText = 
📝 *New Draft Ready for Approval*

*Type:* +draft.type+
*Caption:*
\\\\\\\\\
+draft.caption+
\\\\\\\\\
+(draft.hashtags ? *Hashtags:*\n+draft.hashtags+\n : '')+
*Draft ID:* \\\\\\\

Approve to post immediately, or reject for revisions.
;

    const payload = {
      chat_id: USER_ID,
      text: messageText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approve', callback_data: 'approve_'+draft.id },
            { text: '❌ Reject', callback_data: 'reject_'+draft.id }
          ]
        ]
      }
    };

    const response = await axios.post(TELEGRAM_API+'/sendMessage', payload);
    const telegramMessageId = response.data.result.message_id;
    
    pendingApprovals.set(draft.id, {
      status: 'pending',
      telegramMessageId,
      draft,
      sentAt: new Date(),
      onApprove: draft.onApprove || null,
      onReject: draft.onReject || null
    });
    
    console.log('📤 Draft '+draft.id+' sent to Telegram. Message ID: '+telegramMessageId);
    return { messageId: telegramMessageId, draftId: draft.id };
  } catch (error) {
    console.error('❌ Failed to send draft '+draft.id+':', error.response?.data || error.message);
    throw error;
  }
}

async function startPolling() {
  console.log('🤖 Telegram approval bot started. Polling for updates...');
  
  while (true) {
    try {
      const response = await axios.get(TELEGRAM_API+'/getUpdates', {
        params: { offset: lastUpdateId + 1 }
      });

      const updates = response.data.result || [];
      
      for (const update of updates) {
        lastUpdateId = update.update_id;

        if (update.callback_query) {
          const callbackQuery = update.callback_query;
          const data = callbackQuery.data;
          const messageId = callbackQuery.message.message_id;
          const callbackId = callbackQuery.id;

          const [action, draftId] = data.split('_');

          if (action === 'approve') {
            await handleApproval(draftId, messageId, callbackId);
          } else if (action === 'reject') {
            await handleRejection(draftId, messageId, callbackId);
          }
        }
      }
    } catch (error) {
      console.error('❌ Polling error:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
}

async function handleApproval(draftId, messageId, callbackId) {
  const approval = pendingApprovals.get(draftId);
  if (!approval) return;
  
  approval.status = 'approved';
  approval.approvedAt = new Date();

  try {
    await axios.post(TELEGRAM_API+'/editMessageText', {
      chat_id: USER_ID,
      message_id: messageId,
      text: '✅ *Post Approved!*\n\nPosting to Instagram now...\n\nDraft ID: \\\'+draftId+'\\\',
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] }
    });

    await axios.post(TELEGRAM_API+'/answerCallbackQuery', {
      callback_query_id: callbackId,
      text: '✅ Post approved! Posting now...',
      show_alert: false
    });

    console.log('✅ Draft '+draftId+' approved! Posting to Instagram...');

    if (approval.onApprove && typeof approval.onApprove === 'function') {
      await approval.onApprove(approval.draft);
    }

    setTimeout(async () => {
      try {
        await axios.post(TELEGRAM_API+'/sendMessage', {
          chat_id: USER_ID,
          text: '🎉 *Post Published!*\n\nYour content is now live on Instagram.\n\nDraft ID: \\\'+draftId+'\\\',
          parse_mode: 'Markdown'
        });
      } catch (err) {
        console.error('Failed to send confirmation:', err.message);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error handling approval:', error.message);
  }
}

async function handleRejection(draftId, messageId, callbackId) {
  const approval = pendingApprovals.get(draftId);
  if (!approval) return;
  
  approval.status = 'rejected';
  approval.rejectedAt = new Date();

  try {
    await axios.post(TELEGRAM_API+'/editMessageText', {
      chat_id: USER_ID,
      message_id: messageId,
      text: '❌ *Post Rejected*\n\nThis draft will not be posted.\n\nDraft ID: \\\'+draftId+'\\\',
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] }
    });

    await axios.post(TELEGRAM_API+'/answerCallbackQuery', {
      callback_query_id: callbackId,
      text: '❌ Post rejected.',
      show_alert: false
    });

    console.log('❌ Draft '+draftId+' rejected!');

    if (approval.onReject && typeof approval.onReject === 'function') {
      await approval.onReject(approval.draft);
    }

  } catch (error) {
    console.error('❌ Error handling rejection:', error.message);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TELEGRAM APPROVAL BOT - TEST');
  console.log('='.repeat(60) + '\n');

  startPolling();
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('📤 Sending test draft to your Telegram...\n');

  const testDraft = {
    id: 'test_'+Date.now(),
    type: 'image',
    caption: 'Transform your digital presence with our proven SEO strategies! 🚀\n\nWe help businesses rank higher, get more visibility, and attract qualified leads.',
    hashtags: '#SEO #DigitalMarketing #BusinessGrowth',
    onApprove: async (draft) => {
      console.log('\n✅ APPROVED! Draft will post to Instagram...\n');
    },
    onReject: async (draft) => {
      console.log('\n❌ REJECTED! Draft discarded.\n');
    }
  };

  try {
    const result = await sendForApproval(testDraft);
    console.log('✅ Draft sent successfully!');
    console.log('   Draft ID: '+result.draftId+'\n');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }

  console.log('━'.repeat(60));
  console.log('📱 CHECK YOUR TELEGRAM NOW');
  console.log('━'.repeat(60) + '\n');
  console.log('Tap ✅ or ❌ on the message in your Telegram bot\n');
  console.log('⏳ Waiting... (timeout in 5 minutes)\n');

  const timeout = 5 * 60 * 1000;
  await new Promise(resolve => setTimeout(resolve, timeout));

  console.log('\n⏰ Test ended.\n');
  process.exit(0);
}

main().catch(console.error);
