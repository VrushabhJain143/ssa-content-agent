const axios = require('axios');

async function generateCaptionWithGemini(idea) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: `Create an engaging Instagram caption for: "${idea.title}". 
Make it 2-3 sentences with CTA. Format: Just caption.`
          }]
        }]
      }
    );
    
    const caption = response.data.candidates[0].content.parts[0].text;
    
    return {
      success: true,
      caption: caption
    };
  } catch (error) {
    console.error('Gemini error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { generateCaptionWithGemini };