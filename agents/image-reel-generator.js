const axios = require('axios');

async function getImageFromUnsplash(keyword) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: keyword,
        count: 1,
        client_id: accessKey
      }
    });
    
    if (response.data.results.length > 0) {
      return {
        url: response.data.results[0].urls.regular,
        photographer: response.data.results[0].user.name,
        imageId: response.data.results[0].id
      };
    }
    return null;
  } catch (error) {
    console.error('Unsplash error:', error.message);
    return null;
  }
}

async function getImageForIdea(idea) {
  const keyword = idea.title.split(' ').slice(0, 3).join(' ');
  const image = await getImageFromUnsplash(keyword);
  
  return {
    ideaId: idea.id,
    ideaTitle: idea.title,
    imageUrl: image?.url || null,
    imageSource: image ? 'unsplash' : null,
    readyForPublish: image ? true : false
  };
}

module.exports = {
  getImageFromUnsplash,
  getImageForIdea
};