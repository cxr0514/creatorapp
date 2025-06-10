'use client'

import { Button } from '@/components/ui/button'

interface Clip {
  id: number
  title: string
  startTime: number
  endTime: number
}

interface EnhancedBatchExportModalProps {
  isOpen: boolean
  onClose: () => void
  clips: Clip[]
  onExportComplete?: () => void
}

export function EnhancedBatchExportModal({ isOpen, onClose, clips, onExportComplete }: EnhancedBatchExportModalProps) {
  const handleBatchExport = () => {
    console.log('Batch exporting clips:', clips)
    onExportComplete?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Batch Export Clips</h2>
        <div className="space-y-4">
          <p>Export {clips?.length} selected clips</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleBatchExport}>
              Export All
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
