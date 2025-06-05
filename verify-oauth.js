#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

console.log('🔍 Verifying OAuth Configuration...\n');

// Check if server is running
const checkServer = () => {
  return new Promise((resolve) => {
    const req = require('http').get('http://localhost:3000/api/auth/providers', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const providers = JSON.parse(data);
          console.log('✅ NextAuth server is running');
          console.log('✅ Google provider configured:', providers.google ? 'YES' : 'NO');
          resolve(true);
        } catch (e) {
          console.log('❌ Error parsing providers response');
          resolve(false);
        }
      });
    });
    req.on('error', () => {
      console.log('❌ Server not running on localhost:3000');
      resolve(false);
    });
  });
};

// Check environment variables
const checkEnv = () => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    const hasSecret = envLocal.includes('NEXTAUTH_SECRET=');
    const hasClientId = envLocal.includes('GOOGLE_CLIENT_ID=');
    const hasClientSecret = envLocal.includes('GOOGLE_CLIENT_SECRET=');
    
    console.log('✅ Environment file exists');
    console.log('✅ NEXTAUTH_SECRET:', hasSecret ? 'SET' : 'MISSING');
    console.log('✅ GOOGLE_CLIENT_ID:', hasClientId ? 'SET' : 'MISSING');
    console.log('✅ GOOGLE_CLIENT_SECRET:', hasClientSecret ? 'SET' : 'MISSING');
    
    if (hasClientId) {
      const clientIdMatch = envLocal.match(/GOOGLE_CLIENT_ID=([^\n\r]+)/);
      if (clientIdMatch) {
        console.log('📝 Client ID:', clientIdMatch[1].substring(0, 20) + '...');
      }
    }
    
    return hasSecret && hasClientId && hasClientSecret;
  } catch (e) {
    console.log('❌ .env.local file not found');
    return false;
  }
};

// Main verification
const main = async () => {
  console.log('🚀 OAuth Configuration Verification\n');
  
  const envOk = checkEnv();
  console.log('');
  
  const serverOk = await checkServer();
  console.log('');
  
  if (envOk && serverOk) {
    console.log('✅ Configuration looks good!');
    console.log('');
    console.log('🔗 Test the OAuth flow:');
    console.log('   http://localhost:3000/api/auth/signin/google');
    console.log('');
    console.log('⚠️  If you still get "Access blocked" error:');
    console.log('   1. Add your email as a test user in Google Cloud Console');
    console.log('   2. Make sure redirect URI is: http://localhost:3000/api/auth/callback/google');
    console.log('   3. Clear browser cookies for localhost:3000');
  } else {
    console.log('❌ Configuration issues found. Please fix the above errors.');
  }
};

main().catch(console.error);
