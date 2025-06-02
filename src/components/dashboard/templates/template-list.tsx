'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateTemplateModal } from './create-template-modal'
import { EditTemplateModal } from './edit-template-modal'
import { Palette, Plus, Edit, Trash2, Eye } from '@/lib/icons'

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

export function TemplateList() {
  const [templates, setTemplates] = useState<StyleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setCreateModalOpen(true)
  }

  const handleEditTemplate = (template: StyleTemplate) => {
    setSelectedTemplate(template)
    setEditModalOpen(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handleModalClose = () => {
    setCreateModalOpen(false)
    setEditModalOpen(false)
    setSelectedTemplate(null)
    fetchTemplates() // Refresh the list
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTemplatePreview = (template: StyleTemplate) => {
    const hasColors = template.primaryColor || template.secondaryColor || template.backgroundColor
    const hasAssets = template.logoCloudinaryId || template.introCloudinaryId || template.outroCloudinaryId
    const hasText = template.lowerThirdText || template.callToActionText
    
    return {
      hasColors,
      hasAssets,
      hasText,
      elementCount: [hasColors, hasAssets, hasText].filter(Boolean).length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Style Templates</h2>
          <p className="text-gray-600">Create and manage brand templates for your video exports</p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first style template to brand your video exports with consistent colors, fonts, and overlays.
            </p>
            <Button onClick={handleCreateTemplate}>Create Your First Template</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const preview = getTemplatePreview(template)
            
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Color Preview */}
                    {preview.hasColors && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Colors:</span>
                        <div className="flex gap-1">
                          {template.primaryColor && (
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: template.primaryColor }}
                              title={`Primary: ${template.primaryColor}`}
                            />
                          )}
                          {template.secondaryColor && (
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: template.secondaryColor }}
                              title={`Secondary: ${template.secondaryColor}`}
                            />
                          )}
                          {template.backgroundColor && (
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: template.backgroundColor }}
                              title={`Background: ${template.backgroundColor}`}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Font */}
                    {template.fontFamily && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Font:</span>
                        <span className="text-sm font-medium" style={{ fontFamily: template.fontFamily }}>
                          {template.fontFamily}
                        </span>
                      </div>
                    )}

                    {/* Assets */}
                    {preview.hasAssets && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Assets:</span>
                        <div className="flex gap-1 text-xs">
                          {template.logoCloudinaryId && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Logo</span>
                          )}
                          {template.introCloudinaryId && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Intro</span>
                          )}
                          {template.outroCloudinaryId && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Outro</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text Overlays */}
                    {preview.hasText && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Text:</span>
                        <div className="flex gap-1 text-xs">
                          {template.lowerThirdText && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Lower Third</span>
                          )}
                          {template.callToActionText && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded">CTA</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-gray-500">
                      Updated {formatDate(template.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateTemplateModal
        isOpen={createModalOpen}
        onClose={handleModalClose}
      />

      {selectedTemplate && (
        <EditTemplateModal
          isOpen={editModalOpen}
          template={selectedTemplate}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
} 