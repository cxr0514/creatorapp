import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Types for workflow data
interface WorkflowAction {
  id: string
  type: string
  config: Record<string, unknown>
  platform?: string
}

interface WorkflowTrigger {
  id: string
  type: string
  config: Record<string, unknown>
}

interface Workflow {
  id: string
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  platforms: string[]
  isActive: boolean
  userId: string
  lastRun: Date
  totalRuns: number
  successRate: number
  createdAt: Date
  updatedAt: Date
}

// Helper function to extract platforms from actions
function extractPlatforms(actions: Array<{ platform?: string }>): string[] {
  const platforms = new Set<string>()
  actions.forEach(action => {
    if (action.platform) {
      platforms.add(action.platform)
    }
  })
  return Array.from(platforms)
}

// Mock workflows data - in production this would come from a database
const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: '1',
    name: 'Auto Publish to TikTok',
    description: 'Automatically crop and publish new videos to TikTok with trending hashtags',
    userId: 'user1',
    triggers: [{ id: 't1', type: 'manual', config: {} }],
    actions: [
      { id: 'a1', type: 'crop', config: { format: 'vertical' } },
      { id: 'a2', type: 'publish', platform: 'tiktok', config: { caption: 'Auto-generated from ContentWizard! #content #automation' } }
    ],
    isActive: true,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    totalRuns: 47,
    successRate: 94,
    platforms: ['tiktok'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Multi-Platform Publisher',
    description: 'Publish to YouTube, Instagram, and TikTok with platform-specific formatting',
    userId: 'user1',
    triggers: [{ id: 't2', type: 'manual', config: {} }],
    actions: [
      { id: 'a3', type: 'crop', config: { multiFormat: true } },
      { id: 'a4', type: 'publish', platform: 'youtube', config: {} },
      { id: 'a5', type: 'publish', platform: 'instagram', config: {} },
      { id: 'a6', type: 'publish', platform: 'tiktok', config: {} }
    ],
    isActive: true,
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
    totalRuns: 23,
    successRate: 89,
    platforms: ['youtube', 'instagram', 'tiktok'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Schedule for Prime Time',
    description: 'Schedule posts for optimal engagement times across platforms',
    userId: 'user1',
    triggers: [{ id: 't3', type: 'manual', config: {} }],
    actions: [
      { id: 'a7', type: 'crop', config: { format: 'square' } },
      { id: 'a8', type: 'schedule', config: { 
        youtube: '2pm EST',
        instagram: '7pm EST',
        tiktok: '6pm EST'
      }}
    ],
    isActive: true,
    lastRun: new Date(Date.now() - 48 * 60 * 60 * 1000),
    totalRuns: 15,
    successRate: 100,
    platforms: ['youtube', 'instagram', 'tiktok'],
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Gaming Content Workflow',
    description: 'Specialized workflow for gaming content with gaming-specific hashtags',
    userId: 'user1',
    triggers: [{ id: 't4', type: 'keyword', config: { keywords: ['gaming', 'gameplay'] } }],
    actions: [
      { id: 'a9', type: 'crop', config: { format: 'landscape' } },
      { id: 'a10', type: 'publish', platform: 'youtube', config: { 
        tags: ['gaming', 'gameplay', 'streamer'] 
      }},
      { id: 'a11', type: 'notify', config: { email: true } }
    ],
    isActive: false,
    lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    totalRuns: 8,
    successRate: 87,
    platforms: ['youtube'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
]

export async function GET() {
  // TODO: Use request parameter when implementing filtering/pagination
  try {
    const session = await getServerSession(authOptions)
    
    // For development/testing: Allow access even without session
    if (!session?.user?.email) {
      console.warn('No authenticated session found, returning mock workflows for development')
      // Return mock workflows for development/testing
      const activeWorkflows = MOCK_WORKFLOWS.filter(w => w.isActive)
      return NextResponse.json({
        workflows: activeWorkflows,
        total: activeWorkflows.length
      })
    }

    // Filter active workflows
    const activeWorkflows = MOCK_WORKFLOWS.filter(w => w.isActive)

    return NextResponse.json({
      workflows: activeWorkflows,
      total: activeWorkflows.length
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For development/testing: Allow access even without session
    const userId = session?.user?.email || 'development@test.com'
    if (!session?.user?.email) {
      console.warn('No authenticated session found, using development user for workflow operations')
    }

    const body = await request.json()
    const { action, workflowId, ...workflowData } = body

    // If no action is provided, treat as workflow creation
    if (!action) {
      const newWorkflow: Workflow = {
        id: `workflow_${Date.now()}`,
        name: workflowData.name || 'Untitled Workflow',
        description: workflowData.description || '',
        userId: userId,
        triggers: workflowData.triggers || [],
        actions: workflowData.actions || [],
        isActive: workflowData.isActive !== undefined ? workflowData.isActive : true,
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // Set to yesterday to avoid undefined
        totalRuns: 0,
        successRate: 100,
        platforms: extractPlatforms(workflowData.actions || []),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Add to mock array (in production this would be saved to database)
      MOCK_WORKFLOWS.push(newWorkflow)

      return NextResponse.json({
        success: true,
        workflow: newWorkflow
      })
    }

    switch (action) {
      case 'create':
        // Create new workflow (legacy support)
        const newWorkflow: Workflow = {
          id: `workflow_${Date.now()}`,
          userId: userId,
          ...workflowData,
          totalRuns: 0,
          successRate: 100,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        MOCK_WORKFLOWS.push(newWorkflow)

        return NextResponse.json({
          success: true,
          workflow: newWorkflow
        })

      case 'toggle':
        // Toggle workflow active status
        if (!workflowId) {
          return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 })
        }

        const toggleIndex = MOCK_WORKFLOWS.findIndex(w => w.id === workflowId)
        if (toggleIndex === -1) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
        }

        MOCK_WORKFLOWS[toggleIndex].isActive = !MOCK_WORKFLOWS[toggleIndex].isActive
        MOCK_WORKFLOWS[toggleIndex].updatedAt = new Date()

        return NextResponse.json({
          success: true,
          workflow: MOCK_WORKFLOWS[toggleIndex]
        })

      case 'run':
        // Manually run workflow
        if (!workflowId) {
          return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 })
        }

        const runWorkflow = MOCK_WORKFLOWS.find(w => w.id === workflowId)
        if (!runWorkflow) {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
        }

        // Update workflow stats
        const runIndex = MOCK_WORKFLOWS.findIndex(w => w.id === workflowId)
        if (runIndex !== -1) {
          MOCK_WORKFLOWS[runIndex].lastRun = new Date()
          MOCK_WORKFLOWS[runIndex].totalRuns += 1
          MOCK_WORKFLOWS[runIndex].updatedAt = new Date()
        }

        return NextResponse.json({
          success: true,
          message: `Workflow "${runWorkflow.name}" executed successfully`,
          executionId: `exec_${Date.now()}`
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing workflow request:', error)
    return NextResponse.json({ error: 'Failed to process workflow request' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For development/testing: Allow access even without session
    if (!session?.user?.email) {
      console.warn('No authenticated session found, allowing workflow update for development')
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing workflow id' }, { status: 400 })
    }

    const workflowIndex = MOCK_WORKFLOWS.findIndex(w => w.id === id)
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Update workflow while preserving existing stats and metadata
    const updatedWorkflow: Workflow = {
      ...MOCK_WORKFLOWS[workflowIndex],
      name: updates.name || MOCK_WORKFLOWS[workflowIndex].name,
      description: updates.description || MOCK_WORKFLOWS[workflowIndex].description,
      triggers: updates.triggers || MOCK_WORKFLOWS[workflowIndex].triggers,
      actions: updates.actions || MOCK_WORKFLOWS[workflowIndex].actions,
      isActive: updates.isActive !== undefined ? updates.isActive : MOCK_WORKFLOWS[workflowIndex].isActive,
      platforms: extractPlatforms(updates.actions || MOCK_WORKFLOWS[workflowIndex].actions),
      updatedAt: new Date()
    }

    MOCK_WORKFLOWS[workflowIndex] = updatedWorkflow

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow
    })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // For development/testing: Allow access even without session
    if (!session?.user?.email) {
      console.warn('No authenticated session found, allowing workflow deletion for development')
    }

    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')

    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 })
    }

    const workflowIndex = MOCK_WORKFLOWS.findIndex(w => w.id === workflowId)
    if (workflowIndex === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Remove workflow
    const deletedWorkflow = MOCK_WORKFLOWS.splice(workflowIndex, 1)[0]

    return NextResponse.json({
      success: true,
      message: `Workflow "${deletedWorkflow.name}" deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
