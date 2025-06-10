'use client'

import { Button } from '@/components/ui/button'

interface Clip {
  id: number
  title: string
  startTime: number
  endTime: number
}

interface WorkflowApplyModalProps {
  isOpen: boolean
  onClose: () => void
  clip: Clip
  onApplyWorkflow: (clipId: number, workflowId: string) => Promise<void>
}

export function WorkflowApplyModal({ isOpen, onClose, clip, onApplyWorkflow }: WorkflowApplyModalProps) {
  const handleApplyWorkflow = async () => {
    console.log('Applying workflow to clip:', clip)
    await onApplyWorkflow(clip.id, 'default-workflow')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Apply Workflow</h2>
        <div className="space-y-4">
          <p>Apply workflow to: {clip?.title}</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApplyWorkflow}>
              Apply Workflow
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
