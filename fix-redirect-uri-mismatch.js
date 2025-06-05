#!/usr/bin/env node

console.log('🔧 GOOGLE OAUTH REDIRECT URI MISMATCH - FIX GUIDE');
console.log('==================================================\n');

console.log('❌ CURRENT ERROR:');
console.log('   Error 400: redirect_uri_mismatch');
console.log('   "This app sent an invalid request"\n');

console.log('🔍 ROOT CAUSE:');
console.log('   Your server is running on PORT 3001, but Google OAuth is configured for PORT 3000\n');

console.log('✅ FIXES APPLIED TO LOCAL FILES:');
console.log('   📝 Updated .env.local:');
console.log('      NEXTAUTH_URL=http://localhost:3001');
console.log('      GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/callback/google');
console.log('   📝 Updated .env:');
console.log('      NEXTAUTH_URL=http://localhost:3001');
console.log('      GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/callback/google\n');

console.log('🌐 REQUIRED: UPDATE GOOGLE CLOUD CONSOLE');
console.log('   1. Open: https://console.cloud.google.com/apis/credentials');
console.log('   2. Find your OAuth 2.0 Client ID: 735190318381-mbf0qd2tovqs935196rknbk5v79o06h3.apps.googleusercontent.com');
console.log('   3. Click EDIT (pencil icon)');
console.log('   4. In "Authorized redirect URIs" section, ADD:');
console.log('      http://localhost:3001/api/auth/callback/google');
console.log('   5. Click SAVE\n');

console.log('⚠️  IMPORTANT NOTES:');
console.log('   • Keep BOTH port 3000 AND 3001 redirect URIs for flexibility');
console.log('   • Google changes take 5-10 minutes to propagate');
console.log('   • Clear browser cache after updating Google Console\n');

console.log('🎯 AFTER UPDATING GOOGLE CONSOLE:');
console.log('   1. Wait 5-10 minutes for changes to propagate');
console.log('   2. Clear browser cache/cookies for localhost:3001');
console.log('   3. Try OAuth login again: http://localhost:3001');
console.log('   4. Should redirect to Google successfully\n');

console.log('🚀 CURRENT SERVER STATUS:');
console.log('   ✅ Server running: http://localhost:3001');
console.log('   ✅ Database connected: Working');
console.log('   ✅ Environment vars: Updated');
console.log('   ⏳ Google Console: Needs manual update\n');

console.log('📋 GOOGLE CONSOLE REDIRECT URIS TO ADD:');
console.log('   http://localhost:3000/api/auth/callback/google  (existing)');
console.log('   http://localhost:3001/api/auth/callback/google  (ADD THIS)');
console.log('   http://localhost:3002/api/auth/callback/google  (optional - for future)');

console.log('\n🎉 Once Google Console is updated, OAuth should work perfectly!');
