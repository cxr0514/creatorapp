'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus,
  Crown,
  User,
  Shield
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';

interface WorkspaceMember {
  id: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: Record<string, unknown>;
  createdAt: string;
  members: WorkspaceMember[];
  _count: {
    members: number;
  };
}

export default function WorkspaceManagement() {
  const { data: session } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: ''
  });
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member' as 'member' | 'admin',
    message: ''
  });

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch('/api/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
        if (data.workspaces.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(data.workspaces[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const createWorkspace = async () => {
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWorkspace)
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaces([...workspaces, data.workspace]);
        setSelectedWorkspace(data.workspace);
        setCreateDialogOpen(false);
        setNewWorkspace({ name: '', description: '' });
        toast({
          title: 'Success',
          description: 'Workspace created successfully'
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    }
  };

  const inviteUser = async () => {
    if (!selectedWorkspace) return;

    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inviteData)
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh workspace data
        fetchWorkspaces();
        setInviteDialogOpen(false);
        setInviteData({ email: '', role: 'member', message: '' });
        toast({
          title: 'Success',
          description: data.member ? 'User added to workspace' : 'Invitation sent successfully'
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors]}>
        {role}
      </Badge>
    );
  };

  const canManageWorkspace = (workspace: Workspace) => {
    const userMember = workspace.members.find(m => m.user.id === session?.user?.id);
    return userMember?.role === 'owner' || userMember?.role === 'admin';
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
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace to collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({...newWorkspace, name: e.target.value})}
                  placeholder="Enter workspace name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace({...newWorkspace, description: e.target.value})}
                  placeholder="Describe your workspace (optional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createWorkspace} disabled={!newWorkspace.name.trim()}>
                Create Workspace
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Workspaces</h2>
          {workspaces.map((workspace) => (
            <Card 
              key={workspace.id}
              className={`cursor-pointer transition-colors ${
                selectedWorkspace?.id === workspace.id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedWorkspace(workspace)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{workspace.name}</h3>
                  <Badge variant="outline">
                    {workspace._count.members} members
                  </Badge>
                </div>
                {workspace.description && (
                  <p className="text-sm text-gray-600 mb-2">{workspace.description}</p>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="w-3 h-3 mr-1" />
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workspace Details */}
        <div className="lg:col-span-2">
          {selectedWorkspace ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedWorkspace.name}</CardTitle>
                      {selectedWorkspace.description && (
                        <p className="text-gray-600 mt-1">{selectedWorkspace.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {canManageWorkspace(selectedWorkspace) && (
                        <>
                          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Invite
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Invite Team Member</DialogTitle>
                                <DialogDescription>
                                  Invite someone to join {selectedWorkspace.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Email</label>
                                  <Input
                                    type="email"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                                    placeholder="Enter email address"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Role</label>
                                  <Select
                                    value={inviteData.role}
                                    onValueChange={(value: 'member' | 'admin') => 
                                      setInviteData({...inviteData, role: value})
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Message (optional)</label>
                                  <Textarea
                                    value={inviteData.message}
                                    onChange={(e) => setInviteData({...inviteData, message: e.target.value})}
                                    placeholder="Add a personal message to the invitation"
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={inviteUser} disabled={!inviteData.email.trim()}>
                                  Send Invitation
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Members ({selectedWorkspace.members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedWorkspace.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.user.image} />
                            <AvatarFallback>
                              {member.user.name?.[0] || member.user.email[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.user.name || 'No name'}</div>
                            <div className="text-sm text-gray-500">{member.user.email}</div>
                            <div className="text-xs text-gray-400">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(member.role)}
                          {getRoleBadge(member.role)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspace Selected</h3>
                  <p className="text-gray-500">Select a workspace to view its details and members.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
