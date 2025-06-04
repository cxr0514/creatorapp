'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  AlertCircle, 
  DollarSign, 
  Activity,
  Search,
  Filter,
  Eye,
  UserX,
  UserCheck,
  Ban
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  accountStatus: string;
  totalStorage: number;
  usageStats: any;
  subscription?: {
    status: string;
    plan: {
      name: string;
      displayName: string;
    };
  };
  _count: {
    videos: number;
    clips: number;
  };
}

interface UserAction {
  type: 'suspend' | 'activate' | 'ban';
  userId: string;
  user: User;
}

export default function AdminUserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAction, setSelectedAction] = useState<UserAction | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!selectedAction) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedAction.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: selectedAction.type,
          reason: actionReason
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${selectedAction.type}d successfully`
        });
        setSelectedAction(null);
        setActionReason('');
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update user',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      user.accountStatus === filterStatus ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    switch (user.accountStatus) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspended</Badge>;
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      default:
        return <Badge variant="outline">{user.accountStatus}</Badge>;
    }
  };

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
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
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.username && (
                        <div className="text-sm text-gray-400">@{user.username}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>
                    {user.subscription ? (
                      <div>
                        <div className="font-medium">{user.subscription.plan.displayName}</div>
                        <Badge variant="outline" className="text-xs">
                          {user.subscription.status}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{user._count.videos} videos</div>
                      <div>{user._count.clips} clips</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatStorage(user.totalStorage)}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* View user details */}}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user.isActive ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAction({
                              type: 'suspend',
                              userId: user.id,
                              user
                            })}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAction({
                              type: 'ban',
                              userId: user.id,
                              user
                            })}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAction({
                            type: 'activate',
                            userId: user.id,
                            user
                          })}
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Action Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction?.type === 'suspend' && 'Suspend User'}
              {selectedAction?.type === 'activate' && 'Activate User'}
              {selectedAction?.type === 'ban' && 'Ban User'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction?.type === 'suspend' && `Suspend ${selectedAction.user.name || selectedAction.user.email}? They will not be able to access their account.`}
              {selectedAction?.type === 'activate' && `Activate ${selectedAction.user.name || selectedAction.user.email}? They will regain access to their account.`}
              {selectedAction?.type === 'ban' && `Ban ${selectedAction.user.name || selectedAction.user.email}? This is a permanent action and they will lose all access.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Reason {selectedAction?.type !== 'activate' && '(Required)'}
              </label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                rows={3}
                required={selectedAction?.type !== 'activate'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUserAction}
              disabled={actionLoading || (selectedAction?.type !== 'activate' && !actionReason.trim())}
              variant={selectedAction?.type === 'ban' ? 'destructive' : 'default'}
            >
              {actionLoading ? 'Processing...' : 
                selectedAction?.type === 'suspend' ? 'Suspend User' :
                selectedAction?.type === 'activate' ? 'Activate User' :
                'Ban User'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
