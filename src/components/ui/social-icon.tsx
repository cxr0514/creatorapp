import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SocialIconProps {
  platform: string
  size?: number
  className?: string
}

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '/icons/youtube.svg',
  tiktok: '/icons/tiktok.svg',
  instagram: '/icons/instagram.svg',
  twitter: '/icons/twitter.svg',
  linkedin: '/icons/linkedin.svg',
  facebook: '/icons/facebook.svg'
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'text-accent-danger',
  tiktok: 'text-black',
  instagram: 'text-accent-warning', 
  twitter: 'text-primary',
  linkedin: 'text-primary',
  facebook: 'text-primary'
}

export function SocialIcon({ platform, size = 24, className }: SocialIconProps) {
  const iconPath = PLATFORM_ICONS[platform.toLowerCase()]
  const colorClass = PLATFORM_COLORS[platform.toLowerCase()] || 'text-gray-600'
  
  if (!iconPath) {
    return <div className={cn('w-6 h-6 bg-gray-300 rounded', className)} />
  }

  return (
    <div className={cn(colorClass, className)} style={{ width: size, height: size }}>
      <Image
        src={iconPath}
        alt={`${platform} icon`}
        width={size}
        height={size}
        className="w-full h-full"
      />
    </div>
  )
}
