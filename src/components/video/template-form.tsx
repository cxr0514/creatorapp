'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTemplates, CreateTemplateData } from '@/lib/hooks/use-templates'
import { useSession } from 'next-auth/react'
import { Upload, X, Palette, Type, Video, Image } from 'lucide-react'

interface TemplateFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: Partial<CreateTemplateData>
  templateId?: string
}

export function TemplateForm({ 
  open, 
  onClose, 
  onSuccess, 
  initialData,
  templateId 
}: TemplateFormProps) {
  const { data: session } = useSession()
  const { createTemplate, updateTemplate, uploadAsset, loading } = useTemplates()
  
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: initialData?.name || '',
    fontFamily: initialData?.fontFamily || 'Arial',
    primaryColor: initialData?.primaryColor || '#ffffff',
    secondaryColor: initialData?.secondaryColor || '#000000',
    backgroundColor: initialData?.backgroundColor || '#000000',
    lowerThirdText: initialData?.lowerThirdText || '',
    lowerThirdPosition: initialData?.lowerThirdPosition || 'bottom_left',
    callToActionText: initialData?.callToActionText || '',
    callToActionUrl: initialData?.callToActionUrl || '',
    callToActionPosition: initialData?.callToActionPosition || 'top_right',
    introCloudinaryId: initialData?.introCloudinaryId || '',
    outroCloudinaryId: initialData?.outroCloudinaryId || '',
    logoCloudinaryId: initialData?.logoCloudinaryId || '',
  })

  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (templateId) {
        await updateTemplate(templateId, formData)
      } else {
        await createTemplate(formData)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  const handleAssetUpload = async (
    file: File,
    assetType: 'logo' | 'intro' | 'outro'
  ) => {
    if (!session?.user?.email) return

    setUploadingAsset(assetType)
    setError(null)

    try {
      const result = await uploadAsset(file, assetType, session.user.email)
      
      setFormData(prev => ({
        ...prev,
        [`${assetType}CloudinaryId`]: result.public_id
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to upload ${assetType}`)
    } finally {
      setUploadingAsset(null)
    }
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: 'logo' | 'intro' | 'outro'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      handleAssetUpload(file, assetType)
    }
  }

  const removeAsset = (assetType: 'logo' | 'intro' | 'outro') => {
    setFormData(prev => ({
      ...prev,
      [`${assetType}CloudinaryId`]: ''
    }))
  }

  const fontOptions = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New'
  ]

  const positionOptions = [
    { value: 'top_left', label: 'Top Left' },
    { value: 'top_center', label: 'Top Center' },
    { value: 'top_right', label: 'Top Right' },
    { value: 'bottom_left', label: 'Bottom Left' },
    { value: 'bottom_center', label: 'Bottom Center' },
    { value: 'bottom_right', label: 'Bottom Right' },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {templateId ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Brand Template"
                required
              />
            </div>

            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={formData.fontFamily}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fontFamily: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font} value={font}>{font}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <h3 className="font-medium">Brand Colors</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-10 p-0 border-0"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-12 h-10 p-0 border-0"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-12 h-10 p-0 border-0"
                  />
                  <Input
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <h3 className="font-medium">Brand Assets</h3>
            </div>

            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  disabled={uploadingAsset === 'logo'}
                />
                {formData.logoCloudinaryId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAsset('logo')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadingAsset === 'logo' && (
                <p className="text-sm text-muted-foreground">Uploading logo...</p>
              )}
              {formData.logoCloudinaryId && (
                <p className="text-sm text-green-600">Logo uploaded successfully</p>
              )}
            </div>

            {/* Intro Video Upload */}
            <div>
              <Label htmlFor="intro">Intro Video</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="intro"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'intro')}
                  disabled={uploadingAsset === 'intro'}
                />
                {formData.introCloudinaryId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAsset('intro')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadingAsset === 'intro' && (
                <p className="text-sm text-muted-foreground">Uploading intro...</p>
              )}
              {formData.introCloudinaryId && (
                <p className="text-sm text-green-600">Intro uploaded successfully</p>
              )}
            </div>

            {/* Outro Video Upload */}
            <div>
              <Label htmlFor="outro">Outro Video</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="outro"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'outro')}
                  disabled={uploadingAsset === 'outro'}
                />
                {formData.outroCloudinaryId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAsset('outro')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadingAsset === 'outro' && (
                <p className="text-sm text-muted-foreground">Uploading outro...</p>
              )}
              {formData.outroCloudinaryId && (
                <p className="text-sm text-green-600">Outro uploaded successfully</p>
              )}
            </div>
          </div>

          {/* Text Overlays */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <h3 className="font-medium">Text Overlays</h3>
            </div>

            {/* Lower Third */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lowerThirdText">Lower Third Text</Label>
                <Input
                  id="lowerThirdText"
                  value={formData.lowerThirdText}
                  onChange={(e) => setFormData(prev => ({ ...prev, lowerThirdText: e.target.value }))}
                  placeholder="Your Name | Title"
                />
              </div>

              <div>
                <Label htmlFor="lowerThirdPosition">Position</Label>
                <Select
                  value={formData.lowerThirdPosition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, lowerThirdPosition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Call to Action */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="callToActionText">Call to Action Text</Label>
                <Input
                  id="callToActionText"
                  value={formData.callToActionText}
                  onChange={(e) => setFormData(prev => ({ ...prev, callToActionText: e.target.value }))}
                  placeholder="Subscribe Now!"
                />
              </div>

              <div>
                <Label htmlFor="callToActionUrl">CTA URL</Label>
                <Input
                  id="callToActionUrl"
                  value={formData.callToActionUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, callToActionUrl: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="callToActionPosition">CTA Position</Label>
                <Select
                  value={formData.callToActionPosition}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, callToActionPosition: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingAsset !== null}>
              {loading ? 'Saving...' : templateId ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
