'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateForm } from './template-form'
import { useTemplates, StyleTemplate } from '@/lib/hooks/use-templates'
import { Plus, Edit, Trash2, Palette, Type } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TemplateListProps {
  onSelectTemplate?: (template: StyleTemplate) => void
  selectedTemplateId?: string
  selectionMode?: boolean
}

export function TemplateList({ 
  onSelectTemplate, 
  selectedTemplateId,
  selectionMode = false 
}: TemplateListProps) {
  const { templates, loading, deleteTemplate } = useTemplates()
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<StyleTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<StyleTemplate | null>(null)

  const handleEdit = (template: StyleTemplate) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleDelete = (template: StyleTemplate) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    try {
      await deleteTemplate(templateToDelete.id)
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingTemplate(null)
  }

  const getTemplateFeatures = (template: StyleTemplate) => {
    const features = []
    
    if (template.logoCloudinaryId) features.push('Logo')
    if (template.introCloudinaryId) features.push('Intro')
    if (template.outroCloudinaryId) features.push('Outro')
    if (template.lowerThirdText) features.push('Lower Third')
    if (template.callToActionText) features.push('CTA')
    
    return features
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
            <CardFooter>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Style Templates</h2>
          <p className="text-muted-foreground">
            Create and manage your brand templates for consistent video styling
          </p>
        </div>
        
        {!selectionMode && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first style template to apply consistent branding to your videos
            </p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`transition-all hover:shadow-md ${
                selectedTemplateId === template.id 
                  ? 'ring-2 ring-primary' 
                  : 'hover:border-primary/50'
              } ${selectionMode ? 'cursor-pointer' : ''}`}
              onClick={() => selectionMode && onSelectTemplate?.(template)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{template.name}</span>
                  {selectedTemplateId === template.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Color Preview */}
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
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

                {/* Font */}
                {template.fontFamily && (
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{template.fontFamily}</span>
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {getTemplateFeatures(template).map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              {!selectionMode && (
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Template Form Dialog */}
      <TemplateForm
        open={formOpen}
        onClose={handleFormClose}
        initialData={editingTemplate || undefined}
        templateId={editingTemplate?.id}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
