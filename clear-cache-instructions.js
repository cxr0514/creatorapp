#!/usr/bin/env node

console.log('🧹 Clear Browser Cache Instructions\n');
console.log('To fix OAuth issues, please clear your browser cache for localhost:3000:\n');

console.log('Chrome/Safari:');
console.log('1. Open Developer Tools (F12 or Cmd+Option+I)');
console.log('2. Right-click the refresh button');
console.log('3. Select "Empty Cache and Hard Reload"');
console.log('');

console.log('Or manually:');
console.log('1. Chrome: Settings → Privacy → Clear browsing data');
console.log('2. Safari: Develop → Empty Caches');
console.log('3. Make sure to clear cookies for localhost:3000');
console.log('');

console.log('🔄 After clearing cache, try the OAuth flow again:');
console.log('   http://localhost:3000/api/auth/signin/google');
console.log('');

console.log('✅ Your configuration should now work with:');
console.log('   - NextAuth secret: SET');
console.log('   - Google OAuth: CONFIGURED'); 
console.log('   - Test user: carlos.rodriguez.jj@gmail.com (PENDING - add in console)');
console.log('   - Redirect URI: http://localhost:3000/api/auth/callback/google');
