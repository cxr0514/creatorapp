'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Users, 
  Database,
  Server,
  AlertTriangle,
  TrendingUp,
  Clock,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface SystemMetric {
  id: string;
  type: string;
  name: string;
  value: number;
  timestamp: string;
  metadata: any;
}

interface MetricSummary {
  totalMetrics: number;
  avgValue: number;
  maxValue: number;
  minValue: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  value: any;
  isActive: boolean;
  updatedAt: string;
}

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [summary, setSummary] = useState<MetricSummary | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [metricType, setMetricType] = useState('all');

  useEffect(() => {
    fetchMetrics();
    fetchFeatureFlags();
  }, [timeRange, metricType]);

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      params.append('range', timeRange);
      if (metricType !== 'all') params.append('type', metricType);

      const response = await fetch(`/api/admin/system/metrics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const response = await fetch('/api/admin/feature-flags');
      if (response.ok) {
        const data = await response.json();
        // Convert flags object to array for display
        const flagsArray = Object.entries(data.flags).map(([name, value]) => ({
          id: name,
          name,
          value,
          isActive: true,
          description: '',
          updatedAt: new Date().toISOString()
        }));
        setFeatureFlags(flagsArray);
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    }
  };

  const updateFeatureFlag = async (name: string, value: any) => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          value,
          isActive: true
        })
      });

      if (response.ok) {
        fetchFeatureFlags();
      }
    } catch (error) {
      console.error('Error updating feature flag:', error);
    }
  };

  // Prepare chart data
  const chartData = metrics
    .slice(-20) // Last 20 data points
    .map(metric => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      value: metric.value,
      type: metric.type
    }));

  // Group metrics by type for stats
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) {
      acc[metric.type] = [];
    }
    acc[metric.type].push(metric);
    return acc;
  }, {} as Record<string, SystemMetric[]>);

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'cpu':
        return <Server className="w-5 h-5 text-blue-600" />;
      case 'memory':
        return <Database className="w-5 h-5 text-green-600" />;
      case 'users':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'requests':
        return <Activity className="w-5 h-5 text-orange-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (value: number, type: string) => {
    // Define thresholds for different metric types
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      requests: { warning: 1000, critical: 5000 }
    };

    const threshold = thresholds[type as keyof typeof thresholds];
    if (!threshold) return 'text-gray-600';

    if (value >= threshold.critical) return 'text-red-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'cpu':
      case 'memory':
        return `${value.toFixed(1)}%`;
      case 'storage':
        return `${(value / 1024 / 1024 / 1024).toFixed(1)}GB`;
      default:
        return value.toLocaleString();
    }
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
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <div className="flex items-center space-x-4">
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Metric Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cpu">CPU</SelectItem>
              <SelectItem value="memory">Memory</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="requests">Requests</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metricsByType).map(([type, typeMetrics]) => {
          const latestMetric = typeMetrics[typeMetrics.length - 1];
          const avgValue = typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length;
          
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {getMetricIcon(type)}
                  <Badge variant="outline" className="capitalize">
                    {type}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className={`text-2xl font-bold ${getStatusColor(latestMetric?.value || 0, type)}`}>
                    {formatValue(latestMetric?.value || 0, type)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Avg: {formatValue(avgValue, type)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Last updated: {latestMetric ? new Date(latestMetric.timestamp).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Metrics Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Database Connection</span>
                </div>
                <Badge variant="default">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>API Services</span>
                </div>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Storage Usage</span>
                </div>
                <Badge variant="secondary">Moderate</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Background Jobs</span>
                </div>
                <Badge variant="default">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureFlags.map((flag) => (
              <div key={flag.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{flag.name}</h4>
                  <Badge variant={flag.isActive ? 'default' : 'secondary'}>
                    {flag.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Value: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(flag.value)}</code>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFeatureFlag(flag.name, !flag.value)}
                  >
                    Toggle
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slice(-5).reverse().map((metric, index) => (
              <div key={metric.id} className="flex items-center justify-between p-3 border-l-4 border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  {getMetricIcon(metric.type)}
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-sm text-gray-500">
                      {metric.type} • {formatValue(metric.value, metric.type)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(metric.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
