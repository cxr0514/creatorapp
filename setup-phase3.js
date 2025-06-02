#!/usr/bin/env node

/**
 * CreatorApp Phase 3 Setup Script
 * Generates encryption keys and validates environment configuration
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function validateEnvironmentTemplate() {
  const templatePath = path.join(__dirname, 'env.template');
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(templatePath)) {
    console.error('❌ env.template file not found');
    return false;
  }
  
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env.local from template...');
    fs.copyFileSync(templatePath, envPath);
    console.log('✅ .env.local created successfully');
  }
  
  return true;
}

function updateEnvironmentFile() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    return;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Generate new encryption key if placeholder exists
  if (envContent.includes('your_32_character_encryption_key_here')) {
    const newKey = generateEncryptionKey();
    envContent = envContent.replace(
      'your_32_character_encryption_key_here',
      newKey
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('🔑 Generated new encryption key');
  }
}

function checkOAuthCredentials() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const requiredCredentials = [
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET',
    'INSTAGRAM_CLIENT_ID', 
    'INSTAGRAM_CLIENT_SECRET',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'LINKEDIN_CLIENT_ID',
    'LINKEDIN_CLIENT_SECRET',
    'TIKTOK_CLIENT_ID',
    'TIKTOK_CLIENT_SECRET',
    'OAUTH_ENCRYPTION_KEY',
    'NEXTAUTH_SECRET'
  ];
  
  const configured = [];
  const missing = [];
  
  requiredCredentials.forEach(credential => {
    const line = lines.find(l => l.startsWith(`${credential}=`));
    const hasValue = line && !line.includes('your_') && !line.includes('your-') && line.split('=')[1]?.trim();
    
    if (hasValue) {
      configured.push(credential);
    } else {
      missing.push(credential);
    }
  });
  
  console.log('\n📊 OAuth Configuration Status:');
  console.log(`✅ Configured: ${configured.length}/${requiredCredentials.length}`);
  
  if (configured.length > 0) {
    console.log('\n✅ Configured credentials:');
    configured.forEach(cred => console.log(`  - ${cred}`));
  }
  
  if (missing.length > 0) {
    console.log('\n⚠️  Missing credentials:');
    missing.forEach(cred => console.log(`  - ${cred}`));
    console.log('\n📖 See OAUTH_SETUP_GUIDE.md for setup instructions');
  }
  
  return missing.length === 0;
}

function main() {
  console.log('🚀 CreatorApp Phase 3 Setup Script\n');
  
  // Step 1: Validate and create environment files
  if (!validateEnvironmentTemplate()) {
    process.exit(1);
  }
  
  // Step 2: Generate encryption key if needed
  updateEnvironmentFile();
  
  // Step 3: Check OAuth credentials
  const allConfigured = checkOAuthCredentials();
  
  // Step 4: Provide next steps
  console.log('\n📋 Next Steps:');
  
  if (!allConfigured) {
    console.log('1. 📝 Configure missing OAuth credentials in .env.local');
    console.log('2. 📖 Follow OAUTH_SETUP_GUIDE.md for platform setup');
    console.log('3. 🧪 Test OAuth flows: npm run dev');
  } else {
    console.log('1. 🧪 Test OAuth flows: npm run dev');
    console.log('2. 🚀 Deploy to production when ready');
  }
  
  console.log('4. 📊 Check PRODUCTION_DEPLOYMENT_CHECKLIST.md for full status');
  
  // Step 5: Display helpful commands
  console.log('\n🔧 Useful Commands:');
  console.log('npm run dev              # Start development server');
  console.log('npx prisma db push       # Update database schema');
  console.log('npx prisma generate      # Generate Prisma client');
  console.log('npx prisma studio        # Open database browser');
  
  console.log('\n🎉 Phase 3 implementation is functionally complete!');
  console.log('Ready for OAuth configuration and production deployment.');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateEncryptionKey,
  validateEnvironmentTemplate,
  updateEnvironmentFile,
  checkOAuthCredentials
};
