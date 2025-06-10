// Setup global React for JSX
import React from 'react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

global.React = React

// Mock Video.js since it requires DOM/browser environment
const mockVideojs = {
  dispose: vi.fn(),
  on: vi.fn(),
  currentTime: vi.fn().mockReturnValue(0),
  duration: vi.fn().mockReturnValue(100),
  play: vi.fn(),
  pause: vi.fn(),
  isDisposed: vi.fn().mockReturnValue(false),
}

vi.mock('video.js', () => ({
  default: vi.fn(() => mockVideojs),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return React.createElement('img', { src, alt, ...props })
  },
}))
