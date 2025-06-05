#!/usr/bin/env node

/**
 * Google OAuth Access Denied Fix Verification
 * This script helps debug the AccessDenied error
 */

console.log('🚫 Google OAuth AccessDenied Error - Troubleshooting\n');

console.log('📋 CHECKLIST - Complete these steps in Google Cloud Console:');
console.log('\n1️⃣ OAuth Consent Screen Configuration:');
console.log('   • User Type: External ✓');
console.log('   • App Name: Set ✓');
console.log('   • User Support Email: Set ✓');
console.log('   • Developer Contact: Set ✓');

console.log('\n2️⃣ Test Users (MOST IMPORTANT):');
console.log('   • Add carlos.rodriguez.jj@gmail.com as test user ✓');
console.log('   • Save changes ✓');

console.log('\n3️⃣ OAuth Client Credentials:');
console.log('   • Authorized Redirect URIs:');
console.log('     - http://localhost:3000/api/auth/callback/google ✓');

console.log('\n4️⃣ Authorized Domains:');
console.log('   • localhost (for development) ✓');

console.log('\n🔗 Quick Links:');
console.log('   • OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent');
console.log('   • OAuth Credentials: https://console.cloud.google.com/apis/credentials');

console.log('\n🧪 After making changes:');
console.log('   1. Wait 5-10 minutes for Google changes to propagate');
console.log('   2. Clear browser cookies/cache for localhost:3000');
console.log('   3. Try OAuth login again in incognito mode');

console.log('\n⚠️  Important Notes:');
console.log('   • Apps in "Testing" mode REQUIRE test users to be explicitly added');
console.log('   • Missing test users = AccessDenied error');
console.log('   • Publishing the app (not recommended for dev) removes test user requirement');

console.log('\n🎯 Expected Result:');
console.log('   After adding test user: OAuth should work without AccessDenied error');
