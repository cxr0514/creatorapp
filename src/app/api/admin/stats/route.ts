import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Get admin dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    });

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all stats in parallel
    const [
      totalUsers,
      activeUsers,
      totalSubscriptions,
      premiumSubscriptions,
      totalWorkspaces,
      openTickets,
      revenueData
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { 
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
          }
        } 
      }),
      prisma.subscription.count(),
      prisma.subscription.count({
        where: { 
          status: 'active',
          plan: {
            price: { gt: 0 }
          }
        }
      }),
      prisma.workspace.count(),
      prisma.supportTicket.count({
        where: { 
          status: { in: ['open', 'in_progress'] }
        }
      }),
      prisma.paymentHistory.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'succeeded'
        }
      })
    ]);

    // Calculate monthly revenue
    const monthlySubscriptions = await prisma.subscription.findMany({
      where: { 
        status: 'active',
        currentPeriodStart: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      include: {
        plan: true
      }
    });

    const monthlyRevenue = monthlySubscriptions.reduce((sum: number, sub: any) => {
      return sum + sub.plan.price;
    }, 0);
    
    // Calculate total all-time revenue
    const totalRevenue = revenueData?._sum?.amount || 0;
    
    // Calculate growth rates (mock data for now, replace with real calculations)
    const userGrowthRate = Math.round((activeUsers / totalUsers) * 100);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      userGrowthRate,
      totalSubscriptions,
      premiumSubscriptions,
      monthlyRevenue,
      totalRevenue,
      revenueGrowthRate: 12, // Placeholder - would be calculated from historical data
      totalWorkspaces,
      openTickets
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
