'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StyleTemplate } from '@/lib/hooks/use-templates'
import { Palette, Type, Image, Video, Eye } from 'lucide-react'

interface TemplatePreviewProps {
  template: StyleTemplate
  aspectRatio?: string
  showDetails?: boolean
}

export function TemplatePreview({ 
  template, 
  aspectRatio = '16:9',
  showDetails = true 
}: TemplatePreviewProps) {
  const getPreviewDimensions = () => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 180, height: 320 }
      case '1:1':
        return { width: 240, height: 240 }
      case '4:3':
        return { width: 320, height: 240 }
      default: // 16:9
        return { width: 320, height: 180 }
    }
  }

  const { width, height } = getPreviewDimensions()

  const getTextPosition = (position: string) => {
    const positions = {
      'top_left': { top: '10px', left: '10px' },
      'top_center': { top: '10px', left: '50%', transform: 'translateX(-50%)' },
      'top_right': { top: '10px', right: '10px' },
      'bottom_left': { bottom: '10px', left: '10px' },
      'bottom_center': { bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
      'bottom_right': { bottom: '10px', right: '10px' },
    }
    return positions[position as keyof typeof positions] || positions.bottom_left
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Template Preview
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="flex justify-center">
          <div 
            className="relative rounded-lg border-2 border-dashed border-border overflow-hidden"
            style={{ 
              width: `${width}px`, 
              height: `${height}px`,
              backgroundColor: template.backgroundColor || '#1a1a1a'
            }}
          >
            {/* Background gradient for visual appeal */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${template.primaryColor || '#ffffff'} 0%, ${template.secondaryColor || '#000000'} 100%)`
              }}
            />

            {/* Logo placeholder */}
            {template.logoCloudinaryId && (
              <div 
                className="absolute w-8 h-8 bg-white/20 rounded border flex items-center justify-center"
                style={{
                  top: '10px',
                  right: '10px'
                }}
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-4 w-4 text-white" />
              </div>
            )}

            {/* Lower third text */}
            {template.lowerThirdText && (
              <div
                className="absolute text-xs font-bold px-2 py-1 rounded max-w-[80%]"
                style={{
                  ...getTextPosition(template.lowerThirdPosition || 'bottom_left'),
                  color: template.primaryColor || '#ffffff',
                  backgroundColor: `${template.backgroundColor || '#000000'}CC`,
                  fontFamily: template.fontFamily || 'Arial',
                  fontSize: `${Math.max(10, height * 0.04)}px`
                }}
              >
                {template.lowerThirdText}
              </div>
            )}

            {/* Call to action */}
            {template.callToActionText && (
              <div
                className="absolute text-xs px-2 py-1 rounded"
                style={{
                  ...getTextPosition(template.callToActionPosition || 'top_right'),
                  color: template.secondaryColor || '#ffffff',
                  backgroundColor: `${template.primaryColor || '#ffffff'}20`,
                  fontFamily: template.fontFamily || 'Arial',
                  fontSize: `${Math.max(9, height * 0.035)}px`
                }}
              >
                {template.callToActionText}
              </div>
            )}

            {/* Intro/Outro indicators */}
            {template.introCloudinaryId && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Intro
                </Badge>
              </div>
            )}

            {template.outroCloudinaryId && (
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Outro
                </Badge>
              </div>
            )}

            {/* Center play icon for video representation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Template Details */}
        {showDetails && (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">{template.name}</h4>
              <p className="text-xs text-muted-foreground">
                Aspect Ratio: {aspectRatio} • Font: {template.fontFamily || 'Arial'}
              </p>
            </div>

            {/* Color swatches */}
            <div className="flex items-center gap-2">
              <Palette className="h-3 w-3 text-muted-foreground" />
              <div className="flex gap-1">
                {template.primaryColor && (
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: template.primaryColor }}
                    title={`Primary: ${template.primaryColor}`}
                  />
                )}
                {template.secondaryColor && (
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: template.secondaryColor }}
                    title={`Secondary: ${template.secondaryColor}`}
                  />
                )}
                {template.backgroundColor && (
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: template.backgroundColor }}
                    title={`Background: ${template.backgroundColor}`}
                  />
                )}
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1">
              {template.logoCloudinaryId && (
                <Badge variant="outline" className="text-xs">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-3 w-3 mr-1" />
                  Logo
                </Badge>
              )}
              {template.introCloudinaryId && (
                <Badge variant="outline" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Intro
                </Badge>
              )}
              {template.outroCloudinaryId && (
                <Badge variant="outline" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Outro
                </Badge>
              )}
              {template.lowerThirdText && (
                <Badge variant="outline" className="text-xs">
                  <Type className="h-3 w-3 mr-1" />
                  Lower Third
                </Badge>
              )}
              {template.callToActionText && (
                <Badge variant="outline" className="text-xs">
                  <Type className="h-3 w-3 mr-1" />
                  CTA
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
