const ideator = require('./agents/ideator');

const ideas = ideator.generateIdeas(5);
console.log('\n🎯 Generated Ideas:\n');

ideas.forEach((idea, index) => {
  console.log(index + 1 + '. ' + idea.title);
  console.log('   Type: ' + idea.type + '\n');
});
