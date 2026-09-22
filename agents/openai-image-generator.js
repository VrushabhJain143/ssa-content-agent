const axios = require('axios');

async function generateImageWithDALLE3(prompt) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('🎨 Generating image with DALL-E 3...');
    
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Image generated successfully');
    
    return {
      success: true,
      imageUrl: response.data.data[0].url,
      prompt: prompt,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('DALL-E error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateImage: generateImageWithDALLE3
};