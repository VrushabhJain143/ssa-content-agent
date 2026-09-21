function generateCaption(idea) {
  const captions = {
    reel: 'Stop scrolling! ' + idea + ' (media_reel)\n\nThis is changing everything in 2026. Comment your thoughts below',
    carousel: idea + '\n\nSave this for later! Swipe for actionable tips that work. Which one resonates?',
    image: idea + '\n\nHere is what you need to know: Like if this helped! Share with someone who needs this'
  };

  return captions;
}

function addHashtags(type) {
  const hashtags = {
    reel: '#SEO #DigitalMarketing #SocialMedia #Marketing #TrendingNow',
    carousel: '#ContentStrategy #Marketing #Tips #SocialMediaTips #Growth',
    image: '#Marketing #SEO #DigitalMarketing #ContentMarketing #BusinessTips'
  };

  return hashtags[type] || '#SEO #Marketing';
}

function createCompletePost(idea, type) {
  const captions = generateCaption(idea.title);
  const caption = captions[type] || captions.image;
  const hashtags = addHashtags(type);

  return {
    id: 'post_' + idea.id,
    ideaId: idea.id,
    caption: caption,
    hashtags: hashtags,
    type: type,
    fullPost: caption + '\n\n' + hashtags,
    createdAt: new Date()
  };
}

module.exports = {
  generateCaption,
  addHashtags,
  createCompletePost
};
