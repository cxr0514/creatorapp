'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  MessageCircle,
  Clock,
  CheckCircle,
  Search
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

interface SupportResponse {
  id: string;
  content: string;
  createdAt: string;
  isFromAdmin: boolean;
  admin?: {
    user: {
      name: string;
      image?: string;
    };
  };
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses: SupportResponse[];
}

const CATEGORIES = [
  'technical',
  'billing',
  'feature_request',
  'bug_report',
  'account',
  'other'
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-green-100 text-green-800', icon: Clock },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: MessageCircle },
  { value: 'resolved', label: 'Resolved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
];

export default function SupportTickets() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const response = await fetch(`/api/support/tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async () => {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTicket)
      });

      if (response.ok) {
        const data = await response.json();
        setTickets([data.ticket, ...tickets]);
        setCreateDialogOpen(false);
        setNewTicket({
          subject: '',
          description: '',
          category: 'technical',
          priority: 'medium'
        });
        toast({
          title: 'Success',
          description: 'Support ticket created successfully'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create ticket'
        });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create ticket'
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITIES.find(p => p.value === priority);
    return (
      <Badge className={priorityConfig?.color || 'bg-gray-100 text-gray-800'}>
        {priorityConfig?.label || priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find(s => s.value === status);
    const Icon = statusConfig?.icon || Clock;
    return (
      <div className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
          {statusConfig?.label || status}
        </Badge>
      </div>
    );
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we&apos;ll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({...newTicket, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {formatCategory(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                      setNewTicket({...newTicket, priority: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Provide detailed information about your issue..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createTicket} 
                disabled={!newTicket.subject.trim() || !newTicket.description.trim()}
              >
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {formatCategory(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Tickets ({filteredTickets.length})</h2>
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id}
                className={`cursor-pointer transition-colors ${
                  selectedTicket?.id === ticket.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium line-clamp-1">{ticket.subject}</h3>
                    <div className="flex items-center space-x-2 ml-2">
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {ticket.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(ticket.status)}
                      <Badge variant="outline" className="text-xs">
                        {formatCategory(ticket.category)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {ticket.responses.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ticket Details */}
        <div>
          {selectedTicket ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      <Badge variant="outline">
                        {formatCategory(selectedTicket.category)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-gray-200 pl-4">
                  <div className="text-sm text-gray-500 mb-1">
                    Created {new Date(selectedTicket.createdAt).toLocaleString()}
                  </div>
                  <p className="text-gray-700">{selectedTicket.description}</p>
                </div>

                {selectedTicket.responses.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Responses</h4>
                    {selectedTicket.responses.map((response) => (
                      <div 
                        key={response.id}
                        className={`border rounded-lg p-3 ${
                          response.isFromAdmin ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          {response.isFromAdmin && response.admin?.user && (
                            <>
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={response.admin.user.image} />
                                <AvatarFallback className="text-xs">
                                  {response.admin.user.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {response.admin.user.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">Support</Badge>
                            </>
                          )}
                          {!response.isFromAdmin && (
                            <span className="text-sm font-medium">You</span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{response.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTicket.status !== 'closed' && (
                  <div className="border-t pt-4">
                    <Textarea
                      placeholder="Add a response..."
                      rows={3}
                      className="mb-2"
                    />
                    <Button size="sm">Send Response</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Selected</h3>
                  <p className="text-gray-500">Select a ticket to view its details and responses.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
