import { PrismaClient } from './src/generated/prisma/index.js';

async function checkVideo() {
  const prisma = new PrismaClient();
  
  try {
    // Check the video record
    const video = await prisma.video.findUnique({
      where: { id: 6 },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    console.log('Video record:', JSON.stringify(video, null, 2));
    
    if (video) {
      console.log('\nVideo details:');
      console.log('ID:', video.id);
      console.log('Title:', video.title);
      console.log('Storage Key:', video.storageKey);
      console.log('Storage URL:', video.storageUrl);
      console.log('User:', video.user);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVideo();
