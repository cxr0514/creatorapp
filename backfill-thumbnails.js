#!/usr/bin/env node

/**
 * Backfill Thumbnail URLs for Existing Videos and Clips
 * This script updates the database with thumbnail URLs for videos that don't have them
 */

const { PrismaClient } = require('./src/generated/prisma');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: '.env.local' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

// Fixed thumbnail generation functions
function generateVideoThumbnailFixed(publicId, options = {}) {
  const {
    width = 640,
    height = 360,
    quality = 'auto',
    format = 'jpg',
    startOffset = 0
  } = options;

  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: format, // This forces the output format to be an image
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'center',
        quality,
        start_offset: `${startOffset}s`
      }
    ]
  });
}

function generateClipThumbnailFixed(videoPublicId, startTime, options = {}) {
  const {
    width = 640,
    height = 360,
    quality = 'auto',
    format = 'jpg'
  } = options;

  return cloudinary.url(videoPublicId, {
    resource_type: 'video',
    format: format, // This forces the output format to be an image
    transformation: [
      {
        width,
        height,
        crop: 'fill',
        gravity: 'center',
        quality,
        start_offset: `${startTime}s`
      }
    ]
  });
}

async function backfillThumbnails() {
  console.log('Starting thumbnail backfill...')

  try {
    // Update videos without thumbnails
    const videosWithoutThumbnails = await prisma.video.findMany()

    console.log(`Found ${videosWithoutThumbnails.length} videos to check for thumbnails`)

    for (const video of videosWithoutThumbnails) {
      try {
        // Skip if thumbnail already exists
        if (video.thumbnailUrl && video.thumbnailUrl.trim() !== '') {
          console.log(`⏭️  Skipping video ${video.title} - already has thumbnail`)
          continue
        }
        const thumbnailUrl = generateVideoThumbnailFixed(video.cloudinaryId, {
          width: 640,
          height: 360,
          quality: 'auto'
        })

        await prisma.video.update({
          where: { id: video.id },
          data: { thumbnailUrl }
        })

        console.log(`✅ Updated thumbnail for video: ${video.title}`)
      } catch (error) {
        console.error(`❌ Failed to update thumbnail for video ${video.id}:`, error)
      }
    }

    // Update clips without thumbnails
    const clipsWithoutThumbnails = await prisma.clip.findMany({
      include: {
        video: {
          select: {
            cloudinaryId: true
          }
        }
      }
    })

    console.log(`Found ${clipsWithoutThumbnails.length} clips to check for thumbnails`)

    for (const clip of clipsWithoutThumbnails) {
      try {
        // Skip if thumbnail already exists
        if (clip.thumbnailUrl && clip.thumbnailUrl.trim() !== '') {
          console.log(`⏭️  Skipping clip ${clip.title} - already has thumbnail`)
          continue
        }
        if (clip.video.cloudinaryId && clip.startTime !== null) {
          const thumbnailUrl = generateClipThumbnailFixed(clip.video.cloudinaryId, clip.startTime, {
            width: 640,
            height: 360,
            quality: 'auto'
          })

          await prisma.clip.update({
            where: { id: clip.id },
            data: { thumbnailUrl }
          })

          console.log(`✅ Updated thumbnail for clip: ${clip.title}`)
        }
      } catch (error) {
        console.error(`❌ Failed to update thumbnail for clip ${clip.id}:`, error)
      }
    }

    console.log('✅ Thumbnail backfill completed!')
  } catch (error) {
    console.error('❌ Error during thumbnail backfill:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the backfill
backfillThumbnails()
