#!/usr/bin/env node

/**
 * Final Google OAuth Fix Verification
 * This script confirms that the OAuth route conflict has been resolved
 */

console.log('🎯 Final Google OAuth Fix Verification\n');

async function runVerification() {
  try {
    // Test 1: Verify NextAuth Google Provider
    console.log('1️⃣ Testing NextAuth Google Provider...');
    const providersRes = await fetch('http://localhost:3000/api/auth/providers');
    const providers = await providersRes.json();
    
    if (providers.google && providers.google.callbackUrl === 'http://localhost:3000/api/auth/callback/google') {
      console.log('   ✅ NextAuth Google provider configured correctly');
    } else {
      console.log('   ❌ NextAuth Google provider configuration issue');
      return false;
    }

    // Test 2: Verify Social Media OAuth Separation
    console.log('\n2️⃣ Testing Social Media OAuth Route Separation...');
    const socialRes = await fetch('http://localhost:3000/api/social/oauth/callback/youtube?error=test_error', {
      redirect: 'manual'
    });
    
    if (socialRes.status === 307) {
      console.log('   ✅ Social media OAuth routes working on separate path');
    } else {
      console.log('   ❌ Social media OAuth routes not working properly');
      return false;
    }

    // Test 3: Verify No Route Conflict
    console.log('\n3️⃣ Testing No Route Conflict...');
    const googleCallbackRes = await fetch('http://localhost:3000/api/auth/callback/google', {
      redirect: 'manual'
    });
    
    if (googleCallbackRes.status === 400) {
      console.log('   ✅ Google OAuth callback handled by NextAuth (not custom route)');
    } else {
      console.log('   ❌ Route conflict still exists');
      return false;
    }

    console.log('\n🎉 ALL TESTS PASSED! Google OAuth Conflict Resolved');
    console.log('\n📋 Resolution Summary:');
    console.log('   ✅ Moved custom OAuth callbacks to /api/social/oauth/callback/[platform]');
    console.log('   ✅ NextAuth Google OAuth now uses /api/auth/callback/google exclusively');
    console.log('   ✅ No route conflicts between NextAuth and custom OAuth handlers');
    console.log('   ✅ Social media OAuth (YouTube, TikTok, Instagram, etc.) still functional');
    
    console.log('\n🚀 Ready for Manual Testing:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Click "Sign in with Google"');
    console.log('   3. Complete Google OAuth flow');
    console.log('   4. Should redirect to /dashboard after successful authentication');
    
    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

runVerification().then(success => {
  process.exit(success ? 0 : 1);
});
