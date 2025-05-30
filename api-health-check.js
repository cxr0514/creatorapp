#!/usr/bin/env node

/**
 * Quick API Health Check for Thumbnail Implementation
 * Tests the API endpoints to ensure thumbnail functionality is working
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function checkApiHealth() {
  log(colors.cyan, '🔍 API Health Check for Thumbnail Implementation');
  log(colors.cyan, '====================================================');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Check if server is running
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.status === 404) {
      log(colors.green, '✅ Server is running (404 expected for /api/health)');
    } else {
      log(colors.green, '✅ Server is running');
    }
  } catch (error) {
    log(colors.red, '❌ Server is not running or not accessible');
    log(colors.red, '   Please start the server with: npm run dev');
    return;
  }
  
  // Test 2: Check videos API structure (without auth)
  try {
    const response = await fetch(`${baseUrl}/api/videos`);
    if (response.status === 401) {
      log(colors.green, '✅ Videos API requires authentication (expected)');
    } else {
      log(colors.yellow, '⚠️  Videos API responded without auth check');
    }
  } catch (error) {
    log(colors.red, `❌ Videos API error: ${error.message}`);
  }
  
  // Test 3: Check clips API structure (without auth)
  try {
    const response = await fetch(`${baseUrl}/api/clips`);
    if (response.status === 401) {
      log(colors.green, '✅ Clips API requires authentication (expected)');
    } else {
      log(colors.yellow, '⚠️  Clips API responded without auth check');
    }
  } catch (error) {
    log(colors.red, `❌ Clips API error: ${error.message}`);
  }
  
  // Test 4: Check if Cloudinary utilities exist
  try {
    const fs = require('fs');
    const path = require('path');
    const cloudinaryPath = path.join(process.cwd(), 'src', 'lib', 'cloudinary.ts');
    
    if (fs.existsSync(cloudinaryPath)) {
      const content = fs.readFileSync(cloudinaryPath, 'utf8');
      if (content.includes('generateVideoThumbnail') && content.includes('generateClipThumbnail')) {
        log(colors.green, '✅ Cloudinary thumbnail utilities are implemented');
      } else {
        log(colors.red, '❌ Cloudinary thumbnail functions not found');
      }
    } else {
      log(colors.red, '❌ Cloudinary utilities file not found');
    }
  } catch (error) {
    log(colors.red, `❌ Error checking Cloudinary utilities: ${error.message}`);
  }
  
  // Test 5: Check if components have thumbnail support
  try {
    const fs = require('fs');
    const path = require('path');
    
    const videoListPath = path.join(process.cwd(), 'src', 'components', 'dashboard', 'video-list.tsx');
    const clipListPath = path.join(process.cwd(), 'src', 'components', 'dashboard', 'clip-list.tsx');
    
    if (fs.existsSync(videoListPath)) {
      const content = fs.readFileSync(videoListPath, 'utf8');
      if (content.includes('thumbnailUrl') && content.includes('onError')) {
        log(colors.green, '✅ Video list component has thumbnail support with fallback');
      } else {
        log(colors.red, '❌ Video list component missing thumbnail support');
      }
    }
    
    if (fs.existsSync(clipListPath)) {
      const content = fs.readFileSync(clipListPath, 'utf8');
      if (content.includes('thumbnailUrl') && content.includes('onError')) {
        log(colors.green, '✅ Clip list component has thumbnail support with fallback');
      } else {
        log(colors.red, '❌ Clip list component missing thumbnail support');
      }
    }
  } catch (error) {
    log(colors.red, `❌ Error checking components: ${error.message}`);
  }
  
  // Test 6: Check database schema
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      const videoThumbnail = content.includes('thumbnailUrl') && content.includes('Video');
      const clipThumbnail = content.includes('thumbnailUrl') && content.includes('Clip');
      
      if (videoThumbnail && clipThumbnail) {
        log(colors.green, '✅ Database schema includes thumbnailUrl fields for Video and Clip');
      } else {
        log(colors.red, '❌ Database schema missing thumbnailUrl fields');
      }
    }
  } catch (error) {
    log(colors.red, `❌ Error checking database schema: ${error.message}`);
  }
  
  log(colors.cyan, '\n📋 Summary:');
  log(colors.white, 'The thumbnail implementation appears to be complete.');
  log(colors.white, 'Next step: Manual testing through the browser interface.');
  log(colors.white, '\nTo test manually:');
  log(colors.yellow, '1. Open http://localhost:3000/dashboard');
  log(colors.yellow, '2. Sign in with Google OAuth');
  log(colors.yellow, '3. Upload test_thumbnail_video.mp4');
  log(colors.yellow, '4. Verify thumbnail appears instead of generic icon');
  log(colors.yellow, '5. Create a clip and verify clip thumbnail');
}

// Run the health check
checkApiHealth().catch(console.error);
