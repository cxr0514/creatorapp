import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface StyleTemplate {
  id: string
  name: string
  userId: string
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

export interface CreateTemplateData {
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
}

export function useTemplates() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<StyleTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!session?.user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/templates')
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  const createTemplate = async (templateData: CreateTemplateData): Promise<StyleTemplate> => {
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create template')
      }

      const newTemplate = await response.json()
      setTemplates(prev => [newTemplate, ...prev])
      return newTemplate
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateTemplate = async (
    templateId: string, 
    updates: Partial<CreateTemplateData>
  ): Promise<StyleTemplate> => {
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update template')
      }

      const updatedTemplate = await response.json()
      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId ? updatedTemplate : template
        )
      )
      return updatedTemplate
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (templateId: string): Promise<void> => {
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete template')
      }

      setTemplates(prev => prev.filter(template => template.id !== templateId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const uploadAsset = async (
    file: File,
    assetType: 'logo' | 'intro' | 'outro',
    userId: string
  ): Promise<{ public_id: string; secure_url: string; resource_type: string }> => {
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('assetType', assetType)
      formData.append('userId', userId)

      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload asset')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload asset'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    uploadAsset,
  }
}
