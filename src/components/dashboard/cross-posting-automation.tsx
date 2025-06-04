'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlatformIcon, PlatformBadge } from '@/lib/platform-icons'
import { SOCIAL_PLATFORMS, formatContentForPlatform, PostContent } from '@/lib/social-publishing'
import { 
  ArrowRight, 
  Copy, 
  Settings, 
  Play, 
  Pause, 
  Edit3, 
  Trash2,
  Plus,
  Clock,
  Zap
} from 'lucide-react'

interface CrossPostRule {
  id: string
  name: string
  description: string
  sourcePlatform: string
  targetPlatforms: string[]
  isActive: boolean
  delayMinutes: number
  contentTransform: {
    adaptTitle: boolean
    adaptDescription: boolean
    adaptHashtags: boolean
    customTitleSuffix?: string
    hashtagStrategy: 'keep' | 'adapt' | 'remove'
  }
  conditions: {
    minViews?: number
    minLikes?: number
    minEngagementRate?: number
    timeWindow?: number // hours
  }
  createdAt: Date
  lastTriggered?: Date
  successCount: number
  failureCount: number
}

interface CrossPostExecution {
  id: string
  ruleId: string
  sourcePostId: string
  sourcePlatform: string
  targetPlatform: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  scheduledTime: Date
  executedTime?: Date
  error?: string
  sourceContent: PostContent
  adaptedContent: PostContent
}

export function CrossPostingAutomation() {
  const [rules, setRules] = useState<CrossPostRule[]>([])
  const [executions, setExecutions] = useState<CrossPostExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRule, setSelectedRule] = useState<CrossPostRule | null>(null)
  const [activeTab, setActiveTab] = useState<'rules' | 'executions'>('rules')

  useEffect(() => {
    loadRules()
    loadExecutions()
  }, [])

  const loadRules = async () => {
    try {
      const response = await fetch('/api/cross-posting/rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error loading cross-posting rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/cross-posting/executions')
      if (response.ok) {
        const data = await response.json()
        setExecutions(data.executions || [])
      }
    } catch (error) {
      console.error('Error loading executions:', error)
    }
  }

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/cross-posting/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      
      if (response.ok) {
        setRules(prev => 
          prev.map(rule => 
            rule.id === ruleId ? { ...rule, isActive } : rule
          )
        )
      }
    } catch (error) {
      console.error('Error updating rule status:', error)
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      const response = await fetch(`/api/cross-posting/rules/${ruleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId))
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const getStatusIcon = (status: CrossPostExecution['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing':
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'success':
        return <div className="w-4 h-4 bg-green-500 rounded-full" />
      case 'failed':
        return <div className="w-4 h-4 bg-red-500 rounded-full" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  const getStatusColor = (status: CrossPostExecution['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'processing':
        return 'text-blue-600 bg-blue-50'
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cross-Posting Automation</h2>
          <p className="text-gray-600 mt-1">Automatically share content across multiple platforms</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{rules.length}</div>
          <div className="text-sm text-gray-600">Total Rules</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {rules.filter(r => r.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Rules</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {executions.filter(e => e.status === 'success').length}
          </div>
          <div className="text-sm text-gray-600">Successful Posts</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {executions.filter(e => e.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending Posts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Automation Rules ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'executions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Activity ({executions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'rules' ? (
            /* Rules Tab */
            <div className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-12">
                  <Copy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules</h3>
                  <p className="text-gray-600 mb-4">Create your first rule to start cross-posting automatically</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Rule
                  </Button>
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3">{rule.description}</p>
                        
                        {/* Platform Flow */}
                        <div className="flex items-center gap-2 mb-3">
                          <PlatformBadge platformId={rule.sourcePlatform} size="sm" />
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="flex gap-1">
                            {rule.targetPlatforms.map(platform => (
                              <PlatformBadge key={platform} platformId={platform} size="sm" />
                            ))}
                          </div>
                        </div>
                        
                        {/* Rule Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Delay:</span> {rule.delayMinutes}m
                          </div>
                          <div>
                            <span className="font-medium">Success:</span> {rule.successCount}
                          </div>
                          <div>
                            <span className="font-medium">Failures:</span> {rule.failureCount}
                          </div>
                          <div>
                            <span className="font-medium">Last Run:</span> {
                              rule.lastTriggered 
                                ? new Date(rule.lastTriggered).toLocaleDateString()
                                : 'Never'
                            }
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRuleStatus(rule.id, !rule.isActive)}
                          className="p-2"
                        >
                          {rule.isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRule(rule)}
                          className="p-2"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Executions Tab */
            <div className="space-y-4">
              {executions.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-gray-600">Cross-posting executions will appear here</p>
                </div>
              ) : (
                executions.map((execution) => (
                  <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platformId={execution.sourcePlatform} size="sm" />
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <PlatformIcon platformId={execution.targetPlatform} size="sm" />
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                            {execution.status}
                          </div>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">{execution.sourceContent.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Scheduled: {new Date(execution.scheduledTime).toLocaleString()}
                        </p>
                        
                        {execution.error && (
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            Error: {execution.error}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusIcon(execution.status)}
                        <span className="text-xs text-gray-500">
                          {execution.executedTime 
                            ? new Date(execution.executedTime).toLocaleTimeString()
                            : 'Pending'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
