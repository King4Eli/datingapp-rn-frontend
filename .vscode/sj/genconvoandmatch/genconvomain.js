 
// run-conversation-generator.js
const ConversationGenerator = require('./genconversation');
const readline = require('readline');

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer.trim());
    });
  });
}

// Helper for yes/no questions
async function askYesNo(question, defaultValue = false) {
  const defaultText = defaultValue ? 'Y/n' : 'y/N';
  const answer = await askQuestion(`${question} (${defaultText}): `);

  if (answer === '') return defaultValue;
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

// Display menu
function displayMenu() {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 CONVERSATION GENERATOR v2.1');
  console.log('='.repeat(50));
  console.log('\n📋 MAIN MENU:');
  console.log('1️⃣   Quick Start (Default settings)');
  console.log('2️⃣   Custom Mode (Choose all options)');
  console.log('3️⃣   Conversation Only (For existing matches)');
  console.log('4️⃣   Matches Only (No conversations)');
  console.log('0️⃣   Exit');
  console.log('='.repeat(50));
}

async function quickStart() {
  console.log('\n⚡ QUICK START MODE');
  console.log('Using default settings:');
  console.log('   • Method: Opposite gender');
  console.log('   • Matches: 10');
  console.log('   • Conversation chance: 70%');
  console.log('   • Generate: Both matches & conversations');
  console.log('   • Skip on Ollama error: Yes');

  const confirm = await askYesNo('\nStart with these settings?', true);
  if (!confirm) {
    console.log('Returning to menu...');
    return mainMenu();
  }

  return await runSimulation('both', 'opposite', 10, 70);
}

async function customMode() {
  console.log('\n🔧 CUSTOM MODE');

  // What to generate
  console.log('\n📦 What would you like to generate?');
  console.log('1. Both matches and conversations');
  console.log('2. Only matches');
  console.log('3. Only messages (for existing matches)');

  const genChoice = await askQuestion('\nChoose (1/2/3): ');
  let option;
  switch (genChoice) {
    case '1': option = 'both'; break;
    case '2': option = 'matches'; break;
    case '3': option = 'messages'; break;
    default:
      console.log('Invalid choice, using default (both)');
      option = 'both';
  }

  // Matching method
  console.log('\n🎯 Matching method:');
  console.log('1. Opposite gender');
  console.log('2. Random (respects preferences)');

  const methodChoice = await askQuestion('\nChoose (1/2): ');
  const method = methodChoice === '1' ? 'opposite' : 'random';

  // Number of matches
  const numMatches = await askQuestion(`\n🔢 How many matches? (default: 10): `) || 10;

  // Conversation chance
  let conversationChance = 70;
  if (option === 'both' || option === 'messages') {
    conversationChance = await askQuestion(`\n🎲 Conversation chance %? (default: 70): `) || 70;
  }

  // Advanced options
  const advanced = await askYesNo('\n⚙️  Configure advanced options?', false);
  let delay = 100;
  let maxTokens = 40;
  let skipOnError = true;

  if (advanced) {
    delay = await askQuestion(`   Message delay (ms)? (default: 100): `) || 100;
    maxTokens = await askQuestion(`   Max tokens per message? (default: 40): `) || 40;
    skipOnError = await askYesNo(`   Skip conversations if Ollama fails? (default: Yes): `, true);
  }

  // Show summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY:');
  console.log(`   Generate: ${option}`);
  console.log(`   Method: ${method === 'opposite' ? 'Opposite gender' : 'Random'}`);
  console.log(`   Matches: ${numMatches}`);
  if (option !== 'matches') {
    console.log(`   Conversation chance: ${conversationChance}%`);
  }
  if (advanced) {
    console.log(`   Delay: ${delay}ms`);
    console.log(`   Max tokens: ${maxTokens}`);
    console.log(`   Skip on Ollama error: ${skipOnError ? 'Yes' : 'No'}`);
  }
  console.log('='.repeat(50));

  const confirm = await askYesNo('\n✅ Start simulation?', true);
  if (!confirm) {
    console.log('Cancelled.');
    return mainMenu();
  }

  return await runSimulation(option, method, parseInt(numMatches), parseInt(conversationChance), {
    delay: parseInt(delay),
    maxTokens: parseInt(maxTokens),
    skipOnError: skipOnError
  });
}

async function messagesOnly() {
  console.log('\n💬 MESSAGES ONLY MODE');
  console.log('This will generate conversations for existing active matches.');

  const numMatches = await askQuestion('\n🔢 How many existing matches to process? (default: 20): ') || 20;
  const conversationChance = await askQuestion('🎲 Conversation chance %? (default: 80): ') || 80;
  const avgMessages = await askQuestion('📝 Average messages per conversation? (default: 5): ') || 5;
  const skipOnError = await askYesNo('⏭️  Skip conversations if Ollama fails? (default: Yes): ', true);

  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY:');
  console.log(`   Process matches: ${numMatches}`);
  console.log(`   Conversation chance: ${conversationChance}%`);
  console.log(`   Avg. messages: ${avgMessages}`);
  console.log(`   Skip on Ollama error: ${skipOnError ? 'Yes' : 'No'}`);
  console.log('='.repeat(50));

  const confirm = await askYesNo('\n✅ Start message generation?', true);
  if (!confirm) {
    console.log('Cancelled.');
    return mainMenu();
  }

  return await runSimulation('messages', 'none', parseInt(numMatches), parseInt(conversationChance), {
    avgMessages: parseInt(avgMessages),
    skipOnError: skipOnError
  });
}

async function matchesOnly() {
  console.log('\n🤝 MATCHES ONLY MODE');
  console.log('This will create matches without conversations.');

  const methodChoice = await askQuestion('\n🎯 Method? (1=Opposite gender, 2=Random): ');
  const method = methodChoice === '1' ? 'opposite' : 'random';
  const numMatches = await askQuestion('🔢 How many matches? (default: 50): ') || 50;

  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY:');
  console.log(`   Method: ${method === 'opposite' ? 'Opposite gender' : 'Random'}`);
  console.log(`   Matches: ${numMatches}`);
  console.log('='.repeat(50));

  const confirm = await askYesNo('\n✅ Create matches?', true);
  if (!confirm) {
    console.log('Cancelled.');
    return mainMenu();
  }

  return await runSimulation('matches', method, parseInt(numMatches), 0);
}

async function runSimulation(option, method, numMatches, conversationChance, advanced = {}) {
  const startTime = Date.now();
  const generator = new ConversationGenerator();

  // Update config with parameters
  generator.config = generator.config || {};
  generator.config.simulation = generator.config.simulation || {};

  generator.config.simulation.numMatches = numMatches;
  generator.config.simulation.conversationChance = conversationChance;

  // Apply advanced settings if provided
  if (advanced.delay) {
    generator.config.simulation.delayBetweenCalls = advanced.delay;
  }
  if (advanced.maxTokens) {
    generator.config.ollama = generator.config.ollama || {};
    generator.config.ollama.maxTokens = advanced.maxTokens;
  }
  if (advanced.avgMessages) {
    // You could add this to the config
  }
  if (advanced.skipOnError !== undefined) {
    generator.config.simulation.skipOnOllamaError = advanced.skipOnError;
  }

  try {
    await generator.initialize();

    let result = {};

    // Run based on option
    if (option === 'messages') {
      console.log('\n📝 Generating messages...');
      result = await generator.generateOnlyMessages(numMatches, conversationChance);
    } else if (option === 'matches') {
      console.log('\n🤝 Creating matches...');
      result = await generator.generateOnlyMatches(method, numMatches);
    } else if (option === 'both') {
      console.log('\n🔄 Generating matches and conversations...');
      result = await generator.generateConversations(method, numMatches, conversationChance);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTS:');
    console.log(`   Time: ${duration.toFixed(2)} seconds`);

    if (result.matches !== undefined) {
      console.log(`   Matches: ${result.matches}`);
    }
    if (result.conversations !== undefined) {
      console.log(`   Conversations: ${result.conversations}`);
    }
    if (result.messages !== undefined) {
      console.log(`   Messages: ${result.messages}`);
    }
    if (result.ollamaSuccess !== undefined) {
      console.log(`   Ollama successful: ${result.ollamaSuccess}`);
    }
    if (result.fallbackUsed !== undefined) {
      console.log(`   Fallback used: ${result.fallbackUsed}`);
    }
    if (result.ollamaSkipped !== undefined && result.ollamaSkipped > 0) {
      console.log(`   Skipped (Ollama failed): ${result.ollamaSkipped}`);
    }
    console.log('='.repeat(50));

    return result;

  } catch (error) {
    console.error('❌ Simulation failed:', error);
    throw error;
  } finally {
    await generator.cleanup();
  }
}

async function mainMenu() {
  displayMenu();

  const choice = await askQuestion('\nEnter your choice (0-4): ');

  switch (choice) {
    case '1':
      await quickStart();
      break;
    case '2':
      await customMode();
      break;
    case '3':
      await messagesOnly();
      break;
    case '4':
      await matchesOnly();
      break;
    case '0':
      console.log('\n👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('\n❌ Invalid choice. Please try again.');
      await mainMenu();
      return;
  }

  // Ask to continue
  const again = await askYesNo('\n🔄 Return to main menu?', true);
  if (again) {
    await mainMenu();
  } else {
    console.log('\n👋 Thank you for using Conversation Generator!');
    rl.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Shutting down gracefully...');
  rl.close();
  process.exit(0);
});

// Export for testing
module.exports = { runGenerator: mainMenu };

// Run if called directly
if (require.main === module) {
  console.clear();
  mainMenu().catch(error => {
    console.error('Fatal error:', error);
    rl.close();
    process.exit(1);
  });
} 