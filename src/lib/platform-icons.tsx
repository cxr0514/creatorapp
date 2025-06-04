// Social media platform icon utilities
import React from 'react'

export interface PlatformIconConfig {
  id: string
  name: string
  displayName: string
  emoji: string
  iconPath: string
  brandColor: string
  gradientClass: string
}

export const PLATFORM_ICON_CONFIG: Record<string, PlatformIconConfig> = {
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    displayName: 'YouTube',
    emoji: '🎥',
    iconPath: '/icons/youtube.svg',
    brandColor: '#FF0000',
    gradientClass: 'from-red-500 to-red-600'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    displayName: 'TikTok',
    emoji: '🎵',
    iconPath: '/icons/tiktok.svg',
    brandColor: '#000000',
    gradientClass: 'from-black to-gray-800'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    displayName: 'Instagram',
    emoji: '📸',
    iconPath: '/icons/instagram.svg',
    brandColor: '#E4405F',
    gradientClass: 'from-purple-500 via-pink-500 to-orange-400'
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    displayName: 'X (Twitter)',
    emoji: '🐦',
    iconPath: '/icons/twitter.svg',
    brandColor: '#1DA1F2',
    gradientClass: 'from-blue-400 to-blue-500'
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    displayName: 'LinkedIn',
    emoji: '💼',
    iconPath: '/icons/linkedin.svg',
    brandColor: '#0A66C2',
    gradientClass: 'from-blue-600 to-blue-700'
  }
}

export interface PlatformIconProps {
  platformId: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
}

export function PlatformIcon({ 
  platformId, 
  size = 'md', 
  className = '', 
  showFallback = true 
}: PlatformIconProps) {
  const config = PLATFORM_ICON_CONFIG[platformId]
  
  if (!config) {
    return showFallback ? <span className={className}>🔗</span> : null
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={config.iconPath}
        alt={`${config.displayName} icon`}
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          if (showFallback) {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              const fallback = document.createElement('span')
              fallback.textContent = config.emoji
              fallback.className = sizeClasses[size].replace('w-', 'text-').replace('h-', '')
              parent.appendChild(fallback)
            }
          }
        }}
      />
    </div>
  )
}

export function PlatformBadge({ 
  platformId, 
  className = '',
  variant = 'default'
}: {
  platformId: string
  className?: string
  variant?: 'default' | 'outline'
}) {
  const config = PLATFORM_ICON_CONFIG[platformId]
  
  if (!config) {
    return null
  }

  const baseClasses = 'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium'
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 bg-white text-gray-700'
    : 'bg-gray-100 text-gray-800'

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      <PlatformIcon platformId={platformId} size="sm" />
      {config.displayName}
    </span>
  )
}

export function getPlatformConfig(platformId: string): PlatformIconConfig | null {
  return PLATFORM_ICON_CONFIG[platformId] || null
}

export function getAllPlatformConfigs(): PlatformIconConfig[] {
  return Object.values(PLATFORM_ICON_CONFIG)
}
