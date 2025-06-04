// Simple admin user creation script
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating admin user...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@creatorapp.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      
      // Update to ensure user is admin
      const updated = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' }
      });
      
      console.log('Updated user role to ADMIN');
      console.log('Admin user details:', {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role
      });
      return;
    }

    // Create new admin user (with plain password for now)
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@creatorapp.com',
        name: 'Admin User',
        password: '$2a$12$LQv3c1yqBWVHxkfhLg.f4elI4Aa6x8uWR/YMm/CW.5dBzQQr.oBTy', // hashed "admin123"
        role: 'ADMIN',
        emailVerified: new Date()
      }
    });

    console.log('Created admin user:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
