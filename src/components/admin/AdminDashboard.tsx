'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CreditCard, 
  Building, 
  MessageSquare,
  Activity,
  Shield,
  BarChart3
} from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import SystemMonitoring from '@/components/admin/SystemMonitoring';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  userGrowthRate: number;
  totalSubscriptions: number;
  premiumSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
  revenueGrowthRate: number;
  totalWorkspaces: number;
  openTickets: number;
}

export default function AdminDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, monitor system health, and configure settings</p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Administrator</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Workspaces</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                    <p className="text-sm text-green-600">
                      {stats?.activeUsers || 0} active ({stats?.userGrowthRate || 0}% active rate)
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subscriptions</p>
                    <p className="text-2xl font-bold">{stats?.totalSubscriptions || 0}</p>
                    <p className="text-sm text-gray-600">
                      {stats?.premiumSubscriptions || 0} premium
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                    <p className="text-sm text-green-600">+{stats?.revenueGrowthRate || 0}% from last month</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                    <p className="text-sm text-gray-600">All time</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Workspaces</p>
                    <p className="text-2xl font-bold">{stats?.totalWorkspaces || 0}</p>
                    <p className="text-sm text-gray-600">Organizations</p>
                  </div>
                  <Building className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Support Tickets</p>
                    <p className="text-2xl font-bold">{stats?.openTickets || 0}</p>
                    <p className="text-sm text-yellow-600">Open tickets</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">System Health</p>
                    <p className="text-2xl font-bold text-green-600">Good</p>
                    <p className="text-sm text-gray-600">All systems operational</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">New user registration</p>
                    <p className="text-sm text-gray-600">john.doe@example.com joined the platform</p>
                  </div>
                  <span className="text-sm text-gray-500">2 minutes ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500 bg-green-50">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">New subscription</p>
                    <p className="text-sm text-gray-600">User upgraded to Pro plan</p>
                  </div>
                  <span className="text-sm text-gray-500">5 minutes ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border-l-4 border-orange-500 bg-orange-50">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium">Support ticket opened</p>
                    <p className="text-sm text-gray-600">Technical issue reported by user</p>
                  </div>
                  <span className="text-sm text-gray-500">10 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Billing management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Workspace management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Support ticket management interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <SystemMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
}
