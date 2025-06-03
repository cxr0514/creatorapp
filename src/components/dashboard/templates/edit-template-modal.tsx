'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StyleTemplate {
  id: string
  name: string
  fontFamily?: string
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  introCloudinaryId?: string
  outroCloudinaryId?: string
  logoCloudinaryId?: string
  lowerThirdText?: string
  lowerThirdPosition?: string
  callToActionText?: string
  callToActionUrl?: string
  callToActionPosition?: string
  createdAt: string
  updatedAt: string
}

interface EditTemplateModalProps {
  isOpen: boolean
  template: StyleTemplate
  onClose: () => void
}

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 
  'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
  'Trebuchet MS', 'Arial Black', 'Impact'
]

const POSITION_OPTIONS = [
  { value: 'top_left', label: 'Top Left' },
  { value: 'top_center', label: 'Top Center' },
  { value: 'top_right', label: 'Top Right' },
  { value: 'center_left', label: 'Center Left' },
  { value: 'center', label: 'Center' },
  { value: 'center_right', label: 'Center Right' },
  { value: 'bottom_left', label: 'Bottom Left' },
  { value: 'bottom_center', label: 'Bottom Center' },
  { value: 'bottom_right', label: 'Bottom Right' }
]

export function EditTemplateModal({ isOpen, template, onClose }: EditTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    fontFamily: '',
    primaryColor: '',
    secondaryColor: '',
    backgroundColor: '',
    lowerThirdText: '',
    lowerThirdPosition: 'bottom_left',
    callToActionText: '',
    callToActionUrl: '',
    callToActionPosition: 'top_right'
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        fontFamily: template.fontFamily || '',
        primaryColor: template.primaryColor || '',
        secondaryColor: template.secondaryColor || '',
        backgroundColor: template.backgroundColor || '',
        lowerThirdText: template.lowerThirdText || '',
        lowerThirdPosition: template.lowerThirdPosition || 'bottom_left',
        callToActionText: template.callToActionText || '',
        callToActionUrl: template.callToActionUrl || '',
        callToActionPosition: template.callToActionPosition || 'top_right'
      })
    }
  }, [template])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Template name is required')
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          fontFamily: formData.fontFamily || undefined,
          primaryColor: formData.primaryColor || undefined,
          secondaryColor: formData.secondaryColor || undefined,
          backgroundColor: formData.backgroundColor || undefined,
          lowerThirdText: formData.lowerThirdText || undefined,
          lowerThirdPosition: formData.lowerThirdPosition || undefined,
          callToActionText: formData.callToActionText || undefined,
          callToActionUrl: formData.callToActionUrl || undefined,
          callToActionPosition: formData.callToActionPosition || undefined
        })
      })

      if (response.ok) {
        onClose()
      } else {
        const error = await response.json()
        alert(`Failed to update template: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Failed to update template')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Style Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Corporate Blue, Gaming Style, Minimalist"
                required
              />
            </div>

            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select value={formData.fontFamily} onValueChange={(value) => handleInputChange('fontFamily', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a font (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No font specified</SelectItem>
                  {FONT_FAMILIES.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Brand Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#FF0000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    placeholder="#00FF00"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    placeholder="#0000FF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text Overlays */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Text Overlays</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lowerThirdText">Lower Third Text</Label>
                <Input
                  id="lowerThirdText"
                  value={formData.lowerThirdText}
                  onChange={(e) => handleInputChange('lowerThirdText', e.target.value)}
                  placeholder="e.g., Your Name | Your Title"
                />
              </div>

              <div>
                <Label htmlFor="lowerThirdPosition">Lower Third Position</Label>
                <Select value={formData.lowerThirdPosition} onValueChange={(value) => handleInputChange('lowerThirdPosition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="callToActionText">Call to Action Text</Label>
                <Input
                  id="callToActionText"
                  value={formData.callToActionText}
                  onChange={(e) => handleInputChange('callToActionText', e.target.value)}
                  placeholder="e.g., Subscribe Now!, Visit our Website"
                />
              </div>

              <div>
                <Label htmlFor="callToActionUrl">Call to Action URL</Label>
                <Input
                  id="callToActionUrl"
                  value={formData.callToActionUrl}
                  onChange={(e) => handleInputChange('callToActionUrl', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="callToActionPosition">Call to Action Position</Label>
              <Select value={formData.callToActionPosition} onValueChange={(value) => handleInputChange('callToActionPosition', value)}>
                <SelectTrigger className="md:w-1/2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Template Information</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
              <p>Last Updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
              <p>Template ID: {template.id}</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 