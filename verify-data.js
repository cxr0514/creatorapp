#!/usr/bin/env node

/**
 * Verify Database State After Thumbnail Backfill
 */

const { PrismaClient } = require('./src/generated/prisma');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verifying database state after thumbnail backfill...\n');

    // Check videos
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        cloudinaryId: true,
        thumbnailUrl: true
      }
    });

    console.log(`📹 Videos (${videos.length} total):`);
    videos.forEach(video => {
      const hasThumbnail = video.thumbnailUrl && video.thumbnailUrl.trim() !== '';
      console.log(`  ${hasThumbnail ? '✅' : '❌'} ${video.title}`);
      if (hasThumbnail) {
        console.log(`     📸 ${video.thumbnailUrl.substring(0, 80)}...`);
      }
    });

    console.log();

    // Check clips
    const clips = await prisma.clip.findMany({
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        video: {
          select: {
            title: true
          }
        }
      }
    });

    console.log(`✂️  Clips (${clips.length} total):`);
    clips.forEach(clip => {
      const hasThumbnail = clip.thumbnailUrl && clip.thumbnailUrl.trim() !== '';
      console.log(`  ${hasThumbnail ? '✅' : '❌'} ${clip.title} (from: ${clip.video.title})`);
      if (hasThumbnail) {
        console.log(`     📸 ${clip.thumbnailUrl.substring(0, 80)}...`);
      }
    });

    console.log('\n🎉 Database verification complete!');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
