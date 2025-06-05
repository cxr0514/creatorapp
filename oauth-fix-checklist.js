#!/usr/bin/env node

console.log('🔍 OAuth Fix Verification Checklist\n');

// Check if server is running
const http = require('http');

const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/auth/providers', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const providers = JSON.parse(data);
          console.log('✅ NextAuth server is running');
          console.log('✅ Google provider available:', providers.google ? 'YES' : 'NO');
          if (providers.google) {
            console.log('   Callback URL:', providers.google.callbackUrl);
          }
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

const main = async () => {
  console.log('📋 Pre-OAuth Test Checklist:\n');
  
  // Check server
  await checkServer();
  
  console.log('\n🔧 Required Actions:');
  console.log('1. ✅ Server running on localhost:3000');
  console.log('2. ⏳ Add test user in Google Cloud Console:');
  console.log('   - Email: carlos.rodriguez.jj@gmail.com');
  console.log('   - Status: PENDING (you need to do this)');
  console.log('3. ⏳ Clear browser cache for localhost:3000');
  console.log('4. ⏳ Test OAuth flow');
  
  console.log('\n📝 Instructions:');
  console.log('1. In Google Cloud Console (https://console.cloud.google.com/apis/credentials/consent):');
  console.log('   - Scroll to "Test users" section');
  console.log('   - Click "+ ADD USERS"');
  console.log('   - Enter: carlos.rodriguez.jj@gmail.com');
  console.log('   - Click "SAVE"');
  
  console.log('\n2. Clear browser cache:');
  console.log('   - Chrome: Right-click refresh → "Empty Cache and Hard Reload"');
  console.log('   - Safari: Develop → Empty Caches');
  
  console.log('\n3. Test OAuth:');
  console.log('   - Go to: http://localhost:3000/api/auth/signin/google');
  console.log('   - Should redirect to Google OAuth');
  console.log('   - Should return to dashboard after successful login');
  
  console.log('\n🚨 If still getting "Access blocked" after adding test user:');
  console.log('   - Double-check the email is exactly: carlos.rodriguez.jj@gmail.com');
  console.log('   - Verify redirect URI is: http://localhost:3000/api/auth/callback/google');
  console.log('   - Try incognito/private browsing mode');
};

main().catch(console.error);
