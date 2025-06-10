'use client'

import { Button } from '@/components/ui/button'

interface Clip {
  id: number
  title: string
  startTime: number
  endTime: number
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  clip: Clip
  onExportComplete?: () => void
}

export function ExportModal({ isOpen, onClose, clip, onExportComplete }: ExportModalProps) {
  const handleExport = () => {
    console.log('Exporting clip:', clip)
    onExportComplete?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Export Clip</h2>
        <div className="space-y-4">
          <p>Export functionality for: {clip?.title}</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
