console.log('Debug script starting...');

const fs = require('fs');
const path = require('path');

console.log('Current directory:', process.cwd());

// Check if .env.local exists and what it contains
const envLocalPath = '.env.local';
if (fs.existsSync(envLocalPath)) {
  console.log('.env.local exists');
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('OPENAI_API_KEY')) {
      console.log(`Found OPENAI_API_KEY at line ${i + 1}: ${line.substring(0, 50)}...`);
    }
  });
} else {
  console.log('.env.local does not exist');
}

console.log('Process env OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('Script completed.');
