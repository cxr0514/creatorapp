// Create admin user for testing subscription plans API
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@creatorapp.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      
      // Update to ensure user is admin
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' }
      });
      
      console.log('Updated user role to ADMIN');
      return existingAdmin;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@creatorapp.com',
        name: 'Admin User',
        password: hashedPassword,
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

    return adminUser;

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
