#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔧 Creating admin user...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@creatorapp.com' },
      include: { adminProfile: true }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      if (existingAdmin.adminProfile) {
        console.log('   Admin profile exists');
        console.log('   Role:', existingAdmin.adminProfile.role);
        console.log('   Permissions:', existingAdmin.adminProfile.permissions);
        return;
      } else {
        console.log('   Creating admin profile...');
        
        const adminProfile = await prisma.admin.create({
          data: {
            userId: existingAdmin.id,
            role: 'super_admin',
            permissions: ['user_management', 'plan_management', 'content_management', 'system_management']
          }
        });
        
        console.log('✅ Admin profile created');
        console.log('   Role:', adminProfile.role);
        console.log('   Permissions:', adminProfile.permissions);
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@creatorapp.com',
        name: 'Admin User',
        password: hashedPassword,
        isActive: true,
        accountStatus: 'active',
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create admin profile
    const adminProfile = await prisma.admin.create({
      data: {
        userId: adminUser.id,
        role: 'super_admin',
        permissions: ['user_management', 'plan_management', 'content_management', 'system_management']
      }
    });

    console.log('✅ Admin profile created');
    console.log('   Role:', adminProfile.role);
    console.log('   Permissions:', adminProfile.permissions);

    console.log('\n🎉 Admin setup complete!');
    console.log('📧 Email: admin@creatorapp.com');
    console.log('🔐 Password: admin123');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
