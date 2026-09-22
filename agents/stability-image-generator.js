const axios = require('axios');

async function generateImageWithStability(prompt) {
  try {
    if (!process.env.STABILITY_API_KEY) {
      throw new Error('STABILITY_API_KEY not configured');
    }

    console.log('🎨 Generating image with Stability AI...');

    const response = await axios.post(
      'https://api.stability.ai/v1/generate',
      {
        prompt: prompt,
        negative_prompt: 'blurry, low quality',
        steps: 25,
        cfg_scale: 7,
        width: 1024,
        height: 1024,
        samples: 1,
        sampler: 'k_dpmpp_2m'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.artifacts && response.data.artifacts[0]) {
      const imageBase64 = response.data.artifacts[0].base64;
      console.log('✅ Image generated successfully');
      return imageBase64;
    } else {
      throw new Error('Invalid response from Stability AI');
    }
  } catch (error) {
    console.error('Stability AI Error:', error.message);
    throw error;
  }
}

module.exports = {
  generateImageWithStability
};