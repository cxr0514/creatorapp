'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ScissorsIcon,
  CloudArrowUpIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import { 
  SiTiktok,
  SiInstagram,
  SiYoutube,
  SiFacebook,
  SiDropbox
} from 'react-icons/si'

interface WorkflowType {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  popular?: boolean
}

interface Platform {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  textColor: string
}

export function CreateWorkflow() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('repurpose-future')
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [selectedDestination, setSelectedDestination] = useState<string>('')

  const workflowTypes: WorkflowType[] = [
    {
      id: 'repurpose-future',
      title: 'Repurpose future content',
      description: 'Automatically publish new content to multiple platforms',
      icon: <ArrowPathIcon className="h-6 w-6" />,
      popular: true
    },
    {
      id: 'repurpose-existing',
      title: 'Repurpose existing content',
      description: 'Transform and redistribute your existing content library',
      icon: <RectangleStackIcon className="h-6 w-6" />
    },
    {
      id: 'create-content',
      title: 'Create content from long-form videos',
      description: 'Automatically generate short content from longer videos',
      icon: <ScissorsIcon className="h-6 w-6" />
    },
    {
      id: 'backup-content',
      title: 'Back up all my content',
      description: 'Automatically save copies of all your content to cloud storage',
      icon: <CloudArrowUpIcon className="h-6 w-6" />
    }
  ]

  const platforms: Platform[] = [
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: SiTiktok,
      bgColor: 'bg-black',
      textColor: 'text-white'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: SiInstagram,
      bgColor: 'bg-gradient-to-br from-primary via-primary to-primary',
      textColor: 'text-white'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: SiYoutube,
      bgColor: 'bg-accent-danger',
      textColor: 'text-white'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: SiFacebook,
      bgColor: 'bg-primary',
      textColor: 'text-white'
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: SiDropbox,
      bgColor: 'bg-primary',
      textColor: 'text-white'
    }
  ]

  const getWorkflowDetails = () => {
    const workflow = workflowTypes.find(w => w.id === selectedWorkflow)
    if (!workflow) return null

    switch (selectedWorkflow) {
      case 'repurpose-future':
        return {
          subtitle: 'Whenever you upload new content to your Source platform, it will be automatically published to your Destination within 2 hours.',
          showSourceDestination: true
        }
      case 'repurpose-existing':
        return {
          subtitle: 'Select existing content from your Source platform and automatically adapt it for your Destination platform.',
          showSourceDestination: true
        }
      case 'create-clips':
        return {
          subtitle: 'Automatically generate short-form clips from your long-form videos using AI.',
          showSourceDestination: false
        }
      case 'backup-content':
        return {
          subtitle: 'Automatically backup all your content to secure cloud storage.',
          showSourceDestination: false
        }
      default:
        return null
    }
  }

  const workflowDetails = getWorkflowDetails()

  const canCreateWorkflow = selectedWorkflow && (
    !workflowDetails?.showSourceDestination || 
    (selectedSource && selectedDestination && selectedSource !== selectedDestination)
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create your first workflow</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          A workflow automates taking content from one platform and publishing it to another.
        </p>
      </div>

      {/* Workflow Type Selection */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">Choose a workflow type</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {workflowTypes.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => setSelectedWorkflow(workflow.id)}
              className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 ${
                selectedWorkflow === workflow.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-border/60 hover:shadow-sm'
              }`}
            >
              {workflow.popular && (
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Popular
                  </span>
                </div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 p-2 rounded-lg ${
                  selectedWorkflow === workflow.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {workflow.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-foreground">{workflow.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{workflow.description}</p>
                </div>
                {selectedWorkflow === workflow.id && (
                  <CheckCircleIcon className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Details */}
      {selectedWorkflow && workflowDetails && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {workflowTypes.find(w => w.id === selectedWorkflow)?.title}
            </h3>
            <p className="text-muted-foreground">{workflowDetails.subtitle}</p>
          </div>

          {workflowDetails.showSourceDestination && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Source Selection */}
              <div>
                <h4 className="text-base font-medium text-foreground mb-4">Source (choose one)</h4>
                <div className="space-y-3">
                  {platforms.map((platform) => (
                    <div
                      key={`source-${platform.id}`}
                      onClick={() => setSelectedSource(platform.id)}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedSource === platform.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border/60'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium mr-3 ${platform.bgColor} ${platform.textColor}`}>
                        <platform.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-foreground">{platform.name}</span>
                      {selectedSource === platform.id && (
                        <CheckCircleIcon className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <ArrowRightIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mt-2">Publishes to</span>
                </div>
              </div>

              {/* Destination Selection */}
              <div>
                <h4 className="text-base font-medium text-foreground mb-4">Destination (choose one)</h4>
                <div className="space-y-3">
                  {platforms.map((platform) => (
                    <div
                      key={`dest-${platform.id}`}
                      onClick={() => setSelectedDestination(platform.id)}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedDestination === platform.id
                          ? 'border-primary bg-primary/10'
                          : selectedSource === platform.id
                          ? 'border-border bg-muted cursor-not-allowed opacity-50'
                          : 'border-border hover:border-border/60'
                      } ${selectedSource === platform.id ? 'pointer-events-none' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium mr-3 ${platform.bgColor} ${platform.textColor}`}>
                        <platform.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-foreground">{platform.name}</span>
                      {selectedDestination === platform.id && selectedSource !== platform.id && (
                        <CheckCircleIcon className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Workflow Button */}
      <div className="flex justify-center">
        <Button
          disabled={!canCreateWorkflow}
          className={`px-8 py-3 text-lg font-medium rounded-lg transition-all duration-200 ${
            canCreateWorkflow
              ? 'bg-gradient-to-r from-primary to-primary hover:from-primary-hover hover:to-primary-hover text-white shadow-lg hover:shadow-xl'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Create Workflow
        </Button>
      </div>

      {/* Help Text */}
      {!canCreateWorkflow && workflowDetails?.showSourceDestination && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Please select both a source and destination platform to create your workflow
          </p>
        </div>
      )}
    </div>
  )
}
