// check-seed.js
const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

async function checkSeed() {
  try {
    const plans = await prisma.subscriptionPlan.findMany()
    console.log('Subscription Plans:', plans.length)
    
    const admin = await prisma.admin.findFirst()
    console.log('Admin user exists:', !!admin)
    
    const flags = await prisma.featureFlag.findMany()
    console.log('Feature flags:', flags.length)
    
    const metrics = await prisma.systemMetric.findMany()
    console.log('System metrics:', metrics.length)
  } catch (error) {
    console.error('Error checking seed data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSeed()
