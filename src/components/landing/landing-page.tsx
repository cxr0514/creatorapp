'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthForm } from '@/components/auth/auth-form'
import { 
  PlayIcon, 
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  ShareIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline'

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showVideoModal, setShowVideoModal] = useState(false)
  return (
    <div className="min-h-screen bg-gradient-to-br from-hero-gradient-from via-background to-hero-gradient-to relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border mb-8">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-sm text-text-secondary">New: Advanced AI Processing</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
            How AI is Redefining
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Content Creation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            Harness the power of AI to optimize every facet of your content creation.
            Transform your long videos into engaging, shareable clips with unprecedented precision.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              onClick={() => signIn('google')}
              size="lg"
              className="text-lg px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Start for Free
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 border-border hover:bg-surface text-text-primary rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-4v4m5-4v4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See How it Works
            </Button>
          </div>

          {/* Stats Section */}
          <div className="flex flex-wrap justify-center gap-8 mb-20">
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary mb-1">4.9+</div>
              <div className="text-sm text-text-muted">Stars rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary mb-1">20k+</div>
              <div className="text-sm text-text-muted">Satisfied customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary mb-1">1M+</div>
              <div className="text-sm text-text-muted">Clips created</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Smart Upload</h3>
              <p className="text-text-muted leading-relaxed">Easily upload your long-form videos and let our AI automatically detect the best moments for clipping.</p>
            </div>

            <div className="group p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary p-4 mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-accent/25 transition-all duration-300">
                <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">AI Processing</h3>
              <p className="text-text-muted leading-relaxed">Our advanced AI analyzes your content to identify engaging moments, trending topics, and optimal clip timing.</p>
            </div>

            <div className="group p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-accent to-accent-light p-4 mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">Instant Sharing</h3>
              <p className="text-text-muted leading-relaxed">Download your perfectly crafted clips and share them instantly across all your social media platforms.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
