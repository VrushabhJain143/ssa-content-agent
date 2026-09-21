const ideaTemplates = {
  educational: [
    "Top {count} {topic} tips that actually work",
    "Common {topic} mistakes brands make",
    "How {topic} changed in {year}",
    "Step-by-step guide to {topic}",
    "Why {topic} matters for your business"
  ],
  trending: [
    "{trend} is changing {topic}",
    "How to use {trend} for {topic}",
    "Is {trend} worth it for {topic}?",
    "{trend}: The {topic} game changer"
  ]
};

const topics = ["SEO", "digital marketing", "social media", "AI", "content strategy", "Google Business Profile"];
const trends = ["AI automation", "video marketing", "voice search", "personalization"];

function generateIdeas(count = 5) {
  const ideas = [];
  
  for (let i = 0; i < count; i++) {
    const categories = Object.keys(ideaTemplates);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const template = ideaTemplates[category][Math.floor(Math.random() * ideaTemplates[category].length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const trend = trends[Math.floor(Math.random() * trends.length)];

    let idea = template
      .replace('{topic}', topic)
      .replace('{trend}', trend)
      .replace('{count}', Math.floor(Math.random() * 5) + 3)
      .replace('{year}', new Date().getFullYear());

    ideas.push({
      id: 'idea_' + Date.now() + '_' + i,
      title: idea,
      type: ['image', 'carousel', 'reel'][Math.floor(Math.random() * 3)],
      category: category
    });
  }
  
  return ideas;
}

function getIdeasForApproval(ideas) {
  return ideas.map(idea => ({
    id: idea.id,
    type: idea.type,
    caption: '📝 ' + idea.title + '\n\nType: ' + idea.type,
    hashtags: '#SEO #DigitalMarketing #Marketing'
  }));
}

module.exports = {
  generateIdeas,
  getIdeasForApproval
};
