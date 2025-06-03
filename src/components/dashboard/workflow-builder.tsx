'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  PlusIcon, 
  PlayIcon, 
  PauseIcon, 
  TrashIcon, 
  PencilIcon,
  ClockIcon,
  RectangleStackIcon,
  TagIcon,
  ShareIcon,
  BoltIcon,
  CalendarIcon,
  CogIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { WorkflowBuilderModal } from './workflow-builder-modal'

interface WorkflowTrigger {
  id: string
  type: 'schedule' | 'upload' | 'keyword' | 'manual'
  config: Record<string, unknown>
}

interface WorkflowAction {
  id: string
  type: 'publish' | 'crop' | 'schedule' | 'notify'
  platform?: string
  config: Record<string, unknown>
}

interface WorkflowData {
  id: string
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  isActive: boolean
  lastRun?: string | Date
  totalRuns: number
  successRate: number
  createdAt: string | Date
}

interface Workflow {
  id: string
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  isActive: boolean
  lastRun?: Date | string
  totalRuns: number
  successRate: number
  createdAt: Date | string
}

const TRIGGER_TYPES = [
  {
    id: 'schedule',
    name: 'Schedule',
    icon: ClockIcon,
    description: 'Run on a specific schedule'
  },
  {
    id: 'upload',
    name: 'Video Upload',
    icon: RectangleStackIcon,
    description: 'Trigger when new video is uploaded'
  },
  {
    id: 'keyword',
    name: 'Keyword Match',
    icon: TagIcon,
    description: 'Trigger when video contains specific keywords'
  },
  {
    id: 'manual',
    name: 'Manual',
    icon: PlayIcon,
    description: 'Run manually on demand'
  }
]

const ACTION_TYPES = [
  {
    id: 'crop',
    name: 'Auto Crop',
    icon: RectangleStackIcon,
    description: 'Automatically crop for different platforms'
  },
  {
    id: 'publish',
    name: 'Publish',
    icon: ShareIcon,
    description: 'Publish to social media platforms'
  },
  {
    id: 'schedule',
    name: 'Schedule Post',
    icon: CalendarIcon,
    description: 'Schedule for later publishing'
  },
  {
    id: 'notify',
    name: 'Send Notification',
    icon: BoltIcon,
    description: 'Send email or webhook notification'
  }
]

const PLATFORM_OPTIONS = [
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'twitter', name: 'X/Twitter' },
  { id: 'linkedin', name: 'LinkedIn' }
]

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)

  // Load workflows from API
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows')
        if (response.ok) {
          const data = await response.json()
          // Ensure dates are properly handled
          const workflows = (data.workflows || []).map((workflow: WorkflowData) => ({
            ...workflow,
            lastRun: workflow.lastRun ? new Date(workflow.lastRun) : undefined,
            createdAt: new Date(workflow.createdAt)
          }))
          setWorkflows(workflows)
        } else {
          console.error('Failed to load workflows')
        }
      } catch (error) {
        console.error('Error loading workflows:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWorkflows()
  }, [])

  const handleToggleWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          workflowId
        })
      })

      if (response.ok) {
        const result = await response.json()
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? result.workflow : w
        ))
      } else {
        console.error('Failed to toggle workflow')
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        const response = await fetch(`/api/workflows?workflowId=${workflowId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setWorkflows(prev => prev.filter(w => w.id !== workflowId))
        } else {
          console.error('Failed to delete workflow')
          alert('Failed to delete workflow')
        }
      } catch (error) {
        console.error('Error deleting workflow:', error)
        alert('Failed to delete workflow')
      }
    }
  }

  const handleSaveWorkflow = async (workflowData: {
    name: string
    description: string
    triggers: Array<{ type: string; config: Record<string, unknown> }>
    actions: Array<{ id: string; type: string; config: Record<string, unknown>; platform?: string }>
  }) => {
    try {
      const method = editingWorkflow ? 'PUT' : 'POST'
      const body = editingWorkflow 
        ? { ...workflowData, id: editingWorkflow.id }
        : workflowData

      const response = await fetch('/api/workflows', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (editingWorkflow) {
          // Update existing workflow
          setWorkflows(prev => prev.map(w => 
            w.id === editingWorkflow.id ? { ...result.workflow, id: editingWorkflow.id } : w
          ))
        } else {
          // Add new workflow
          setWorkflows(prev => [...prev, result.workflow])
        }
        
        setShowCreateModal(false)
        setEditingWorkflow(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save workflow')
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      throw error
    }
  }

  const handleRunWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) return

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run',
          workflowId
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Workflow "${workflow.name}" executed successfully!\n\nExecution ID: ${result.executionId}`)
        
        // Update workflow in local state
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId 
            ? { ...w, lastRun: new Date(), totalRuns: w.totalRuns + 1 }
            : w
        ))
      } else {
        const error = await response.json()
        alert(`Failed to run workflow: ${error.error}`)
      }
    } catch (error) {
      console.error('Error running workflow:', error)
      alert('Failed to run workflow')
    }
  }

  const formatLastRun = (date?: Date | string) => {
    if (!date) return 'Never'
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid date'
    
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.id === type)
    return trigger?.icon || ClockIcon
  }

  const getActionIcon = (type: string) => {
    const action = ACTION_TYPES.find(a => a.id === type)
    return action?.icon || CogIcon
  }

  const getPlatformEmoji = (platform?: string) => {
    const platformOption = PLATFORM_OPTIONS.find(p => p.id === platform)
    return platformOption?.name || 'Platform'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white">Workflows</h1>
            <p className="mt-1 text-sm text-white">
              Automate your content creation and publishing process
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-white rounded w-3/4"></div>
                <div className="h-3 bg-white rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-white rounded"></div>
                  <div className="h-3 bg-white rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Workflows</h1>
          <p className="mt-1 text-sm text-white">
            Automate your content creation and publishing process
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Total Workflows</p>
                <p className="text-2xl font-bold text-white">{workflows.length}</p>
              </div>
              <RectangleStackIcon className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Active</p>
                <p className="text-2xl font-bold text-green-600">{workflows.filter(w => w.isActive).length}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Total Runs</p>
                <p className="text-2xl font-bold text-blue-600">{workflows.reduce((sum, w) => sum + w.totalRuns, 0)}</p>
              </div>
              <PlayIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Avg Success Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {workflows.length > 0 ? Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length) : 0}%
                </p>
              </div>
              <BoltIcon className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((workflow) => {
          const TriggerIcon = getTriggerIcon(workflow.triggers[0]?.type || 'manual')
          
          return (
            <Card key={workflow.id} className={`relative ${workflow.isActive ? 'ring-2 ring-green-200' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <Badge variant={workflow.isActive ? 'default' : 'secondary'} className={workflow.isActive ? 'bg-green-100 text-green-800' : ''}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">{workflow.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRunWorkflow(workflow.id)}
                      className="h-8 w-8 p-0"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingWorkflow(workflow)}
                      className="h-8 w-8 p-0"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Trigger */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <TriggerIcon className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Trigger</p>
                    <p className="text-xs text-blue-700">
                      {TRIGGER_TYPES.find(t => t.id === workflow.triggers[0]?.type)?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">Actions ({workflow.actions.length})</p>
                  <div className="space-y-1">
                    {workflow.actions.slice(0, 3).map((action) => {
                      const ActionIcon = getActionIcon(action.type)
                      return (
                        <div key={action.id} className="flex items-center gap-2 text-xs text-white">
                          <ActionIcon className="h-3 w-3" />
                          <span>{ACTION_TYPES.find(a => a.id === action.type)?.name}</span>
                          {action.platform && (
                            <span className="ml-auto">{getPlatformEmoji(action.platform)}</span>
                          )}
                        </div>
                      )
                    })}
                    {workflow.actions.length > 3 && (
                      <p className="text-xs text-white pl-5">+{workflow.actions.length - 3} more</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-white">Last Run</p>
                    <p className="text-sm font-medium">{formatLastRun(workflow.lastRun)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white">Total Runs</p>
                    <p className="text-sm font-medium">{workflow.totalRuns}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white">Success Rate</p>
                    <p className={`text-sm font-medium ${workflow.successRate >= 90 ? 'text-green-600' : workflow.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {workflow.successRate}%
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleWorkflow(workflow.id)}
                    className={`w-full ${workflow.isActive ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                  >
                    {workflow.isActive ? (
                      <>
                        <PauseIcon className="h-4 w-4 mr-2" />
                        Pause Workflow
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Activate Workflow
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {workflows.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <BoltIcon className="mx-auto h-12 w-12 text-white" />
            <h3 className="mt-2 text-lg font-medium text-white">No Workflows Yet</h3>
            <p className="mt-1 text-sm text-white">
              Create your first automated workflow to streamline your content creation process.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Workflow Builder Modal */}
      <WorkflowBuilderModal
        isOpen={showCreateModal || !!editingWorkflow}
        onClose={() => {
          setShowCreateModal(false)
          setEditingWorkflow(null)
        }}
        editingWorkflow={editingWorkflow}
        onSave={handleSaveWorkflow}
      />
    </div>
  )
}
