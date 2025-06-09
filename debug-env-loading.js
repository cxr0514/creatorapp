const fs = require('fs');
const path = require('path');

console.log('=== Environment Files Debug ===');

const envFiles = [
  '.env.local',
  '.env',
  '.env.example'
];

envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`\n--- ${file} ---`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for OPENAI_API_KEY lines
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('OPENAI_API_KEY')) {
        console.log(`Line ${index + 1}: ${line}`);
        if (line.includes('=')) {
          const value = line.split('=')[1] || '';
          console.log(`  Value length: ${value.length}`);
          console.log(`  Value preview: ${value.substring(0, 20)}...`);
        }
      }
    });
  } else {
    console.log(`\n--- ${file} --- (NOT FOUND)`);
  }
});

console.log('\n=== Process Environment ===');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 
  `${process.env.OPENAI_API_KEY.substring(0, 20)}... (length: ${process.env.OPENAI_API_KEY.length})` : 
  'NOT SET');

console.log('\n=== NODE_ENV ===');
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n=== Current Working Directory ===');
console.log('CWD:', process.cwd());

// Try to manually load dotenv
console.log('\n=== Manual dotenv loading ===');
try {
  require('dotenv').config({ path: '.env.local' });
  console.log('After loading .env.local:', process.env.OPENAI_API_KEY ? 
    `${process.env.OPENAI_API_KEY.substring(0, 20)}... (length: ${process.env.OPENAI_API_KEY.length})` : 
    'NOT SET');
} catch (error) {
  console.error('Error loading .env.local:', error.message);
}
