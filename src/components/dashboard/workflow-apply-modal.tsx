'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  XMarkIcon,
  PlayIcon,
  // ClockIcon, // TODO: Use when implementing time-based triggers
  // RectangleStackIcon, // TODO: Use when implementing batch operations
  // TagIcon, // TODO: Use when implementing tag-based workflows
  // ShareIcon, // TODO: Use when implementing sharing features
  BoltIcon,
  // CalendarIcon, // TODO: Use when implementing calendar integration
  // CogIcon, // TODO: Use when implementing settings
  CheckCircleIcon,
  // ExclamationTriangleIcon // TODO: Use when implementing warnings
} from '@heroicons/react/24/outline'

interface Clip {
  id: number
  title: string
  startTime: number
  endTime: number
  aspectRatio?: string
  createdAt: string
  video: {
    id: number
    title: string
    filename: string
  }
  thumbnailUrl?: string
  status: 'processing' | 'ready' | 'failed'
  description?: string
  hashtags?: string[]
  tags?: string[]
}

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

interface Workflow {
  id: string
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  isActive: boolean
  lastRun?: Date
  totalRuns: number
  successRate: number
  platforms: string[]
}

interface WorkflowApplyModalProps {
  isOpen: boolean
  onClose: () => void
  clip: Clip | null
  onApplyWorkflow: (clipId: number, workflowId: string) => Promise<void>
}

const PLATFORM_OPTIONS = [
  { id: 'youtube', name: 'YouTube', emoji: '📺', color: 'bg-red-100 text-red-800' },
  { id: 'tiktok', name: 'TikTok', emoji: '🎵', color: 'bg-pink-100 text-pink-800' },
  { id: 'instagram', name: 'Instagram', emoji: '📸', color: 'bg-purple-100 text-purple-800' },
  { id: 'twitter', name: 'X/Twitter', emoji: '🐦', color: 'bg-blue-100 text-blue-800' },
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼', color: 'bg-indigo-100 text-indigo-800' }
]

export function WorkflowApplyModal({ isOpen, onClose, clip, onApplyWorkflow }: WorkflowApplyModalProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadWorkflows()
    }
  }, [isOpen])

  const loadWorkflows = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/workflows')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      } else {
        console.error('Failed to load workflows')
        setWorkflows([])
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyWorkflow = async () => {
    if (!selectedWorkflow || !clip) return

    setApplying(true)
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply',
          workflowId: selectedWorkflow,
          clipId: clip.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show success message
        const workflow = workflows.find(w => w.id === selectedWorkflow)
        alert(`Workflow "${workflow?.name}" applied successfully to "${clip.title}"!\n\nExecution ID: ${result.executionId}`)
        
        onApplyWorkflow(clip.id, selectedWorkflow)
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply workflow')
      }
    } catch (error) {
      console.error('Failed to apply workflow:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to apply workflow: ${errorMessage}`)
    } finally {
      setApplying(false)
    }
  }

  const getPlatformBadge = (platformId: string) => {
    const platform = PLATFORM_OPTIONS.find(p => p.id === platformId)
    if (!platform) return null

    return (
      <Badge key={platformId} className={`text-xs ${platform.color}`}>
        {platform.emoji} {platform.name}
      </Badge>
    )
  }

  const getActionSummary = (actions: WorkflowAction[]) => {
    const summary = []
    
    if (actions.some(a => a.type === 'crop')) {
      summary.push('Auto-crop')
    }
    if (actions.some(a => a.type === 'publish')) {
      summary.push('Publish')
    }
    if (actions.some(a => a.type === 'schedule')) {
      summary.push('Schedule')
    }
    if (actions.some(a => a.type === 'notify')) {
      summary.push('Notify')
    }
    
    return summary.join(' → ')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Apply Workflow</h2>
            {clip && (
              <p className="text-sm text-gray-600 mt-1">
                Apply an automated workflow to &ldquo;{clip.title}&rdquo;
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="space-y-4">
              <p className="text-gray-600">Loading available workflows...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Active Workflows</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create some workflows first to apply them to your clips.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select a workflow to apply ({workflows.length} available)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workflows.map((workflow) => (
                    <Card 
                      key={workflow.id} 
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedWorkflow === workflow.id 
                          ? 'ring-2 ring-purple-500 bg-purple-50' 
                          : 'hover:shadow-md hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedWorkflow(workflow.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {workflow.name}
                              {selectedWorkflow === workflow.id && (
                                <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {workflow.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Platforms */}
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Platforms</p>
                          <div className="flex flex-wrap gap-1">
                            {workflow.platforms.map(platformId => getPlatformBadge(platformId))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Actions</p>
                          <p className="text-xs text-gray-600">{getActionSummary(workflow.actions)}</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                          <div>
                            <p className="text-xs text-gray-500">Success Rate</p>
                            <p className={`text-sm font-medium ${
                              workflow.successRate >= 90 ? 'text-green-600' : 
                              workflow.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {workflow.successRate}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Runs</p>
                            <p className="text-sm font-medium text-gray-900">{workflow.totalRuns}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Selected Workflow Preview */}
              {selectedWorkflow && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Workflow Preview</h4>
                  <div className="text-sm text-blue-800">
                    {(() => {
                      const workflow = workflows.find(w => w.id === selectedWorkflow)
                      if (!workflow) return null

                      const steps = []
                      
                      if (workflow.actions.some(a => a.type === 'crop')) {
                        steps.push(`Automatically crop "${clip?.title}" for ${workflow.platforms.join(', ')}`)
                      }
                      
                      if (workflow.actions.some(a => a.type === 'publish')) {
                        steps.push(`Publish to ${workflow.platforms.join(', ')}`)
                      }
                      
                      if (workflow.actions.some(a => a.type === 'schedule')) {
                        steps.push('Schedule for optimal times')
                      }
                      
                      if (workflow.actions.some(a => a.type === 'notify')) {
                        steps.push('Send completion notification')
                      }

                      return (
                        <ul className="space-y-1">
                          {steps.map((step, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedWorkflow && (
              <>Selected: {workflows.find(w => w.id === selectedWorkflow)?.name}</>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={applying}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyWorkflow}
              disabled={!selectedWorkflow || applying}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {applying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Applying...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Apply Workflow
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
