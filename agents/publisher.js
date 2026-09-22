const axios = require('axios');

async function publishToInstagram(imageUrl, caption, hashtags) {
  try {
    if (!process.env.INSTAGRAM_PAGE_ID) {
      throw new Error('INSTAGRAM_PAGE_ID not configured');
    }
    
    if (!process.env.INSTAGRAM_PAGE_ACCESS_TOKEN) {
      throw new Error('INSTAGRAM_PAGE_ACCESS_TOKEN not configured');
    }

    console.log('📸 Publishing to Instagram...');

    const fullCaption = `${caption}\n\n${hashtags}`;

    // Step 1: Create media container
    const mediaResponse = await axios.post(
      `https://graph.instagram.com/v18.0/${process.env.INSTAGRAM_PAGE_ID}/media`,
      {
        image_url: imageUrl,
        caption: fullCaption
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INSTAGRAM_PAGE_ACCESS_TOKEN}`
        }
      }
    );

    if (!mediaResponse.data || !mediaResponse.data.id) {
      throw new Error('Failed to create media container');
    }

    console.log('✅ Media container created:', mediaResponse.data.id);

    // Step 2: Publish media
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v18.0/${process.env.INSTAGRAM_PAGE_ID}/media_publish`,
      {
        creation_id: mediaResponse.data.id
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INSTAGRAM_PAGE_ACCESS_TOKEN}`
        }
      }
    );

    if (!publishResponse.data || !publishResponse.data.id) {
      throw new Error('Failed to publish media');
    }

    console.log('✅ Published to Instagram:', publishResponse.data.id);

    return publishResponse.data.id;

  } catch (error) {
    console.error('Instagram Publish Error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  publishToInstagram
};