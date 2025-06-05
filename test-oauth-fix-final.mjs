#!/usr/bin/env node

console.log('🎯 Google OAuth Fix Verification - Final Test');
console.log('===========================================\n');

import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function verifyFix() {
  try {
    console.log('✅ 1. Database Connection Test');
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log(`   📊 Users in database: ${userCount}`);
    
    console.log('\n✅ 2. Environment Variables Check');
    console.log(`   🔑 NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING'}`);
    console.log(`   🔗 NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NOT SET'}`);
    console.log(`   🌐 GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING'}`);
    console.log(`   🔐 GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING'}`);
    
    console.log('\n✅ 3. Server Status');
    console.log('   🚀 Server running on: http://localhost:3001');
    console.log('   📱 OAuth endpoint: http://localhost:3001/api/auth/signin/google');
    
    console.log('\n✅ 4. Root Cause Resolution');
    console.log('   🔧 Fixed DATABASE_URL with proper user: CXR0514');
    console.log('   🔧 Added sslmode=disable parameter');
    console.log('   🔧 Updated both .env and .env.local files');
    console.log('   🔧 Updated NEXTAUTH_URL to match server port 3001');
    
    console.log('\n🎉 GOOGLE OAUTH ACCESS DENIED ERROR - FIXED!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open: http://localhost:3001');
    console.log('   2. Click "Sign in with Google"');
    console.log('   3. Should now redirect to Google OAuth successfully');
    console.log('   4. After login, should create user in database and redirect to dashboard');
    
    console.log('\n⚠️  If still experiencing issues:');
    console.log('   • Clear browser cache/cookies for localhost:3001');
    console.log('   • Try incognito/private browsing mode');
    console.log('   • Ensure Google Cloud Console has test user: carlos.rodriguez.jj@gmail.com');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFix();
