'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  ClockIcon,
  RectangleStackIcon,
  TagIcon,
  PlayIcon,
  ShareIcon,
  CalendarIcon,
  BoltIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

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
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  isActive: boolean
}

const TRIGGER_TYPES = [
  {
    id: 'schedule',
    name: 'Schedule',
    icon: ClockIcon,
    description: 'Run on a specific schedule',
    color: 'blue'
  },
  {
    id: 'upload',
    name: 'Video Upload',
    icon: RectangleStackIcon,
    description: 'Trigger when new video is uploaded',
    color: 'green'
  },
  {
    id: 'keyword',
    name: 'Keyword Match',
    icon: TagIcon,
    description: 'Trigger when video contains specific keywords',
    color: 'purple'
  },
  {
    id: 'manual',
    name: 'Manual',
    icon: PlayIcon,
    description: 'Run manually on demand',
    color: 'gray'
  }
]

const ACTION_TYPES = [
  {
    id: 'crop',
    name: 'Auto Crop',
    icon: RectangleStackIcon,
    description: 'Automatically crop for different platforms',
    color: 'orange'
  },
  {
    id: 'publish',
    name: 'Publish',
    icon: ShareIcon,
    description: 'Publish to social media platforms',
    color: 'blue'
  },
  {
    id: 'schedule',
    name: 'Schedule Post',
    icon: CalendarIcon,
    description: 'Schedule for later publishing',
    color: 'indigo'
  },
  {
    id: 'notify',
    name: 'Send Notification',
    icon: BoltIcon,
    description: 'Send email or webhook notification',
    color: 'yellow'
  }
]

const PLATFORM_OPTIONS = [
  { id: 'youtube', name: 'YouTube', color: 'red' },
  { id: 'tiktok', name: 'TikTok', color: 'pink' },
  { id: 'instagram', name: 'Instagram', color: 'purple' },
  { id: 'twitter', name: 'X/Twitter', color: 'blue' },
  { id: 'linkedin', name: 'LinkedIn', color: 'blue' }
]

const ASPECT_RATIOS = [
  { id: 'vertical', name: '9:16 (Vertical)', description: 'TikTok, Instagram Reels, YouTube Shorts' },
  { id: 'square', name: '1:1 (Square)', description: 'Instagram Posts, Twitter' },
  { id: 'landscape', name: '16:9 (Landscape)', description: 'YouTube, LinkedIn' }
]

interface WorkflowBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  editingWorkflow?: WorkflowData | null
  onSave: (workflow: WorkflowData) => Promise<void>
}

export function WorkflowBuilderModal({ isOpen, onClose, editingWorkflow, onSave }: WorkflowBuilderModalProps) {
  // All React Hooks must be called at the top level, before any early returns
  const [workflow, setWorkflow] = useState<WorkflowData>(() => 
    editingWorkflow || {
      name: '',
      description: '',
      triggers: [],
      actions: [],
      isActive: true
    }
  )
  
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>('')
  const [selectedActionType, setSelectedActionType] = useState<string>('')
  const [step, setStep] = useState<'basic' | 'triggers' | 'actions' | 'review'>('basic')
  const [saving, setSaving] = useState(false)

  // Helper functions with useCallback
  const generateId = useCallback(() => Math.random().toString(36).substr(2, 9), [])

  const getDefaultTriggerConfig = useCallback((type: string): Record<string, unknown> => {
    switch (type) {
      case 'schedule':
        return { schedule: 'daily', time: '12:00' }
      case 'upload':
        return { folder: 'all' }
      case 'keyword':
        return { keywords: [] }
      case 'manual':
        return {}
      default:
        return {}
    }
  }, [])

  const getDefaultActionConfig = useCallback((type: string): Record<string, unknown> => {
    switch (type) {
      case 'crop':
        return { aspectRatio: 'vertical', smartCrop: true }
      case 'publish':
        return { caption: '', hashtags: '' }
      case 'schedule':
        return { delay: '1h' }
      case 'notify':
        return { email: true, webhook: false }
      default:
        return {}
    }
  }, [])

  const addTrigger = useCallback((type: string) => {
    const newTrigger: WorkflowTrigger = {
      id: generateId(),
      type: type as WorkflowTrigger['type'],
      config: getDefaultTriggerConfig(type)
    }
    
    setWorkflow(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }))
    setSelectedTriggerType('')
  }, [generateId, getDefaultTriggerConfig])

  const addAction = useCallback((type: string) => {
    const newAction: WorkflowAction = {
      id: generateId(),
      type: type as WorkflowAction['type'],
      config: getDefaultActionConfig(type)
    }
    
    setWorkflow(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }))
    setSelectedActionType('')
  }, [generateId, getDefaultActionConfig])

  const removeTrigger = useCallback((id: string) => {
    setWorkflow(prev => ({
      ...prev,
      triggers: prev.triggers.filter(t => t.id !== id)
    }))
  }, [])

  const removeAction = useCallback((id: string) => {
    setWorkflow(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id)
    }))
  }, [])

  const getTriggerDescription = useCallback((trigger: WorkflowTrigger): string => {
    switch (trigger.type) {
      case 'schedule':
        return `${trigger.config.schedule || 'daily'} at ${trigger.config.time || '12:00'}`
      case 'upload':
        return 'when new video is uploaded'
      case 'keyword':
        return `keywords: ${(trigger.config.keywords as string[])?.join(', ') || 'none'}`
      case 'manual':
        return 'run manually'
      default:
        return ''
    }
  }, [])

  const getActionDescription = useCallback((action: WorkflowAction): string => {
    switch (action.type) {
      case 'crop':
        return `${action.config.aspectRatio || 'vertical'} format`
      case 'publish':
        return `to ${action.platform || 'platform'}`
      case 'schedule':
        return `delay ${action.config.delay || '1h'}`
      case 'notify':
        return 'send notification'
      default:
        return ''
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!workflow.name.trim()) {
      alert('Please enter a workflow name')
      return
    }

    if (workflow.triggers.length === 0) {
      alert('Please add at least one trigger')
      return
    }

    if (workflow.actions.length === 0) {
      alert('Please add at least one action')
      return
    }

    setSaving(true)
    try {
      await onSave(workflow)
      onClose()
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert('Failed to save workflow')
    } finally {
      setSaving(false)
    }
  }, [workflow, onSave, onClose])

  // Early return after all hooks are defined
  if (!isOpen) return null

  const getStepIndicator = () => {
    const steps = ['basic', 'triggers', 'actions', 'review']
    const currentIndex = steps.indexOf(step)
    
    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((s, index) => (
          <div key={s} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Workflow Name *
        </label>
        <input
          type="text"
          value={workflow.name}
          onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Enter workflow name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          value={workflow.description}
          onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={3}
          placeholder="Describe what this workflow does"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={workflow.isActive}
          onChange={(e) => setWorkflow(prev => ({ ...prev, isActive: e.target.checked }))}
          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
        />
        <label htmlFor="isActive" className="text-sm text-foreground">
          Activate workflow immediately after creation
        </label>
      </div>
    </div>
  )

  const renderTriggerConfig = (type: string) => {
    switch (type) {
      case 'schedule':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Frequency</label>
              <select className="w-full p-2 border border-gray-300 rounded">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Time</label>
              <input type="time" className="w-full p-2 border border-gray-300 rounded" defaultValue="12:00" />
            </div>
          </div>
        )
      case 'keyword':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Keywords (comma separated)</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded" 
              placeholder="gaming, tutorial, review"
            />
          </div>
        )
      default:
        return <p className="text-sm text-muted-foreground">No additional configuration needed.</p>
    }
  }

  const renderActionConfig = (type: string) => {
    switch (type) {
      case 'crop':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Aspect Ratio</label>
            <select className="w-full p-2 border border-gray-300 rounded">
              {ASPECT_RATIOS.map(ratio => (
                <option key={ratio.id} value={ratio.id}>{ratio.name}</option>
              ))}
            </select>
          </div>
        )
      case 'publish':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Platform</label>
              <select className="w-full p-2 border border-gray-300 rounded">
                {PLATFORM_OPTIONS.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Caption Template</label>
              <textarea 
                className="w-full p-2 border border-gray-300 rounded" 
                rows={2}
                placeholder="New content from ContentWizard! #automation #content"
              />
            </div>
          </div>
        )
      case 'schedule':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Delay</label>
            <select className="w-full p-2 border border-gray-300 rounded">
              <option value="1h">1 hour</option>
              <option value="6h">6 hours</option>
              <option value="1d">1 day</option>
              <option value="1w">1 week</option>
            </select>
          </div>
        )
      default:
        return <p className="text-sm text-muted-foreground">No additional configuration needed.</p>
    }
  }

  const renderTriggers = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Add Triggers</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Triggers determine when your workflow should run. You can add multiple triggers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {TRIGGER_TYPES.map((trigger) => {
            const Icon = trigger.icon
            return (
              <Card 
                key={trigger.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedTriggerType === trigger.id ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setSelectedTriggerType(trigger.id === selectedTriggerType ? '' : trigger.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{trigger.name}</h4>
                      <p className="text-sm text-muted-foreground">{trigger.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {selectedTriggerType && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-purple-900">
                Configure {TRIGGER_TYPES.find(t => t.id === selectedTriggerType)?.name}
              </h4>
              <Button
                size="sm"
                onClick={() => addTrigger(selectedTriggerType)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {renderTriggerConfig(selectedTriggerType)}
          </div>
        )}
      </div>

      {workflow.triggers.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-3">Added Triggers ({workflow.triggers.length})</h4>
          <div className="space-y-2">
            {workflow.triggers.map((trigger) => {
              const triggerType = TRIGGER_TYPES.find(t => t.id === trigger.type)
              const Icon = triggerType?.icon || ClockIcon
              
              return (
                <div key={trigger.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">{triggerType?.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {getTriggerDescription(trigger)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTrigger(trigger.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  const renderActions = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Add Actions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Actions are what your workflow will do when triggered. Add actions in the order you want them to execute.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {ACTION_TYPES.map((action) => {
            const Icon = action.icon
            return (
              <Card 
                key={action.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedActionType === action.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedActionType(action.id === selectedActionType ? '' : action.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{action.name}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {selectedActionType && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-primary">
                Configure {ACTION_TYPES.find(a => a.id === selectedActionType)?.name}
              </h4>
              <Button
                size="sm"
                onClick={() => addAction(selectedActionType)}
                className="bg-primary hover:bg-primary-hover"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            
            {renderActionConfig(selectedActionType)}
          </div>
        )}
      </div>

      {workflow.actions.length > 0 && (
        <div>
          <h4 className="font-medium text-foreground mb-3">Action Sequence ({workflow.actions.length})</h4>
          <div className="space-y-2">
            {workflow.actions.map((action, index) => {
              const actionType = ACTION_TYPES.find(a => a.id === action.type)
              const Icon = actionType?.icon || CogIcon
              
              return (
                <div key={action.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">{index + 1}.</span>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{actionType?.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {getActionDescription(action)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAction(action.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  const renderReview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Review Workflow</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Review your workflow configuration before saving.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            {workflow.name}
          </CardTitle>
          <CardDescription>{workflow.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Triggers ({workflow.triggers.length})</h4>
            {workflow.triggers.map((trigger) => {
              const triggerType = TRIGGER_TYPES.find(t => t.id === trigger.type)
              const Icon = triggerType?.icon || ClockIcon
              return (
                <div key={trigger.id} className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{triggerType?.name}: {getTriggerDescription(trigger)}</span>
                </div>
              )
            })}
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Actions ({workflow.actions.length})</h4>
            {workflow.actions.map((action, index) => {
              const actionType = ACTION_TYPES.find(a => a.id === action.type)
              const Icon = actionType?.icon || CogIcon
              return (
                <div key={action.id} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{index + 1}.</span>
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{actionType?.name}: {getActionDescription(action)}</span>
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                {workflow.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {(workflow.triggers.length === 0 || workflow.actions.length === 0) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Workflow Incomplete</p>
              <p>
                {workflow.triggers.length === 0 && 'You need at least one trigger. '}
                {workflow.actions.length === 0 && 'You need at least one action.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Build automated workflows to streamline your content creation process
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
          
          {getStepIndicator()}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'basic' && renderBasicInfo()}
          {step === 'triggers' && renderTriggers()}
          {step === 'actions' && renderActions()}
          {step === 'review' && renderReview()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <div>
              {step !== 'basic' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const steps = ['basic', 'triggers', 'actions', 'review']
                    const currentIndex = steps.indexOf(step)
                    if (currentIndex > 0) {
                      setStep(steps[currentIndex - 1] as typeof step)
                    }
                  }}
                >
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {step === 'review' ? (
                <Button 
                  onClick={handleSave}
                  disabled={saving || workflow.triggers.length === 0 || workflow.actions.length === 0}
                  className="bg-primary hover:bg-primary-hover"
                >
                  {saving ? 'Saving...' : (editingWorkflow ? 'Save Changes' : 'Create Workflow')}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const steps = ['basic', 'triggers', 'actions', 'review']
                    const currentIndex = steps.indexOf(step)
                    if (currentIndex < steps.length - 1) {
                      setStep(steps[currentIndex + 1] as typeof step)
                    }
                  }}
                  className="bg-primary hover:bg-primary-hover"
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
