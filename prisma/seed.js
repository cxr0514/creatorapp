// prisma/seed.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../src/generated/prisma')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create subscription plans
  console.log('📋 Creating subscription plans...')
  
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'free' },
    create: {
      name: 'free',
      displayName: 'Free',
      description: 'Perfect for getting started with video content creation',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      maxVideos: 5,
      maxStorage: 100, // 100MB
      maxClipsPerVideo: 3,
      maxExportsPerMonth: 10,
      hasAiEnhancement: true,
      hasScheduling: false,
      hasAnalytics: false,
      hasTemplates: true,
      hasPrioritySupport: false,
      hasWhiteLabel: false,
      hasApiAccess: false,
      sortOrder: 1,
      isActive: true,
    },
    update: {
      displayName: 'Free',
      description: 'Perfect for getting started with video content creation',
      priceMonthly: 0,
      priceYearly: 0,
      sortOrder: 1,
      isActive: true,
    },
  })

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'pro' },
    create: {
      name: 'pro',
      displayName: 'Pro',
      description: 'For content creators who need more power and features',
      priceMonthly: 1900, // $19.00
      priceYearly: 19000, // $190.00 (save ~17%)
      currency: 'USD',
      maxVideos: 50,
      maxStorage: 5000, // 5GB
      maxClipsPerVideo: 10,
      maxExportsPerMonth: 100,
      hasAiEnhancement: true,
      hasScheduling: true,
      hasAnalytics: true,
      hasTemplates: true,
      hasPrioritySupport: true,
      hasWhiteLabel: false,
      hasApiAccess: false,
      isPopular: true,
      sortOrder: 2,
      isActive: true,
    },
    update: {
      displayName: 'Pro',
      description: 'For content creators who need more power and features',
      priceMonthly: 1900,
      priceYearly: 19000,
      isPopular: true,
      sortOrder: 2,
      isActive: true,
    },
  })

  const businessPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'business' },
    create: {
      name: 'business',
      displayName: 'Business',
      description: 'For teams and agencies managing multiple clients',
      priceMonthly: 4900, // $49.00
      priceYearly: 49000, // $490.00 (save ~17%)
      currency: 'USD',
      maxVideos: -1, // Unlimited
      maxStorage: -1, // Unlimited
      maxClipsPerVideo: -1, // Unlimited
      maxExportsPerMonth: -1, // Unlimited
      hasAiEnhancement: true,
      hasScheduling: true,
      hasAnalytics: true,
      hasTemplates: true,
      hasPrioritySupport: true,
      hasWhiteLabel: true,
      hasApiAccess: true,
      sortOrder: 3,
      isActive: true,
    },
    update: {
      displayName: 'Business',
      description: 'For teams and agencies managing multiple clients',
      priceMonthly: 4900,
      priceYearly: 49000,
      sortOrder: 3,
      isActive: true,
    },
  })

  console.log(`✅ Created subscription plans: ${freePlan.name}, ${proPlan.name}, ${businessPlan.name}`)

  // Create admin user
  console.log('👤 Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@creatorapp.com' },
    create: {
      email: 'admin@creatorapp.com',
      username: 'admin',
      name: 'System Administrator',
      password: hashedPassword,
      isActive: true,
      accountStatus: 'active',
      emailVerified: new Date(),
    },
    update: {
      name: 'System Administrator',
      isActive: true,
      accountStatus: 'active',
    },
  })

  // Create admin profile
  const adminProfile = await prisma.admin.upsert({
    where: { userId: adminUser.id },
    create: {
      userId: adminUser.id,
      role: 'super_admin',
      permissions: ['user_management', 'content_moderation', 'system_settings', 'analytics_access'],
      canImpersonate: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canAccessLogs: true,
    },
    update: {
      role: 'super_admin',
      permissions: ['user_management', 'content_moderation', 'system_settings', 'analytics_access'],
      canImpersonate: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canAccessLogs: true,
    },
  })

  console.log(`✅ Created admin user: ${adminUser.email} with profile: ${adminProfile.role}`)

  // Create sample feature flags
  console.log('🚩 Creating feature flags...')
  
  const featureFlags = [
    {
      name: 'ai_enhancement_v2',
      description: 'Enable new AI enhancement engine',
      isEnabled: false,
      rolloutPercent: 0,
    },
    {
      name: 'bulk_export',
      description: 'Allow bulk export of multiple clips',
      isEnabled: true,
      rolloutPercent: 100,
    },
    {
      name: 'workspace_collaboration',
      description: 'Enable workspace collaboration features',
      isEnabled: true,
      rolloutPercent: 100,
    },
    {
      name: 'advanced_analytics',
      description: 'Show advanced analytics dashboard',
      isEnabled: false,
      rolloutPercent: 25,
    },
  ]

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      create: flag,
      update: {
        description: flag.description,
        isEnabled: flag.isEnabled,
        rolloutPercent: flag.rolloutPercent,
      },
    })
  }

  console.log(`✅ Created ${featureFlags.length} feature flags`)

  // Create sample system metrics
  console.log('📊 Creating initial system metrics...')
  
  const now = new Date()
  const metrics = [
    {
      metricType: 'user_count',
      value: 1,
      unit: 'count',
      timestamp: now,
      period: 'day',
    },
    {
      metricType: 'video_uploads',
      value: 0,
      unit: 'count',
      timestamp: now,
      period: 'day',
    },
    {
      metricType: 'api_requests',
      value: 0,
      unit: 'count',
      timestamp: now,
      period: 'hour',
    },
  ]

  for (const metric of metrics) {
    await prisma.systemMetric.create({ data: metric })
  }

  console.log(`✅ Created ${metrics.length} initial system metrics`)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
