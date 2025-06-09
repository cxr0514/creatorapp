console.log('=== Environment Debug ===');
console.log('All env vars with OPENAI:');
Object.keys(process.env).forEach(key => {
  if (key.includes('OPENAI')) {
    console.log(`${key}=${process.env[key]?.substring(0, 30)}...`);
  }
});

console.log('\n=== Direct file reading ===');
const fs = require('fs');
const dotenv = require('dotenv');

// Read .env.local directly
if (fs.existsSync('.env.local')) {
  const envLocalContent = fs.readFileSync('.env.local', 'utf8');
  console.log('.env.local OPENAI_API_KEY:');
  envLocalContent.split('\n').forEach(line => {
    if (line.includes('OPENAI_API_KEY')) {
      console.log(`  ${line.substring(0, 50)}...`);
    }
  });
}

// Read .env directly
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log('.env OPENAI_API_KEY:');
  envContent.split('\n').forEach(line => {
    if (line.includes('OPENAI_API_KEY')) {
      console.log(`  ${line.substring(0, 50)}...`);
    }
  });
}

console.log('\n=== Manual dotenv load ===');
// Try loading manually
dotenv.config({ path: '.env.local' });
console.log('After loading .env.local:', process.env.OPENAI_API_KEY?.substring(0, 30) + '...');

dotenv.config({ path: '.env' });
console.log('After loading .env:', process.env.OPENAI_API_KEY?.substring(0, 30) + '...');
