const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '.env.local') });

console.log('Raw API Key:', process.env.OPENAI_API_KEY);
console.log('Key length:', process.env.OPENAI_API_KEY?.length);
console.log('First 20 chars:', process.env.OPENAI_API_KEY?.substring(0, 20));
