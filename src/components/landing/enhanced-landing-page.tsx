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
  StarIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showVideoModal, setShowVideoModal] = useState(false)

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Analysis',
      description: 'Our advanced AI analyzes your content to identify the most engaging moments and trending topics.',
      color: 'from-primary to-accent'
    },
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics',
      description: 'Get detailed insights on performance metrics and audience engagement across all platforms.',
      color: 'from-accent to-accent-light'
    },
    {
      icon: ClockIcon,
      title: 'Automated Scheduling',
      description: 'Schedule your content for optimal times across multiple social media platforms automatically.',
      color: 'from-primary via-accent to-accent-light'
    },
    {
      icon: ShareIcon,
      title: 'Multi-Platform Publishing',
      description: 'Publish to YouTube, TikTok, Instagram, Twitter, and LinkedIn with just one click.',
      color: 'from-accent-light to-primary'
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Creator",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b13c?w=150&h=150&fit=crop&crop=face",
      content: "CreatorApp transformed my workflow. I went from spending hours editing to creating 10x more content in half the time.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Digital Marketer", 
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "The AI suggestions are incredibly accurate. My engagement rates increased by 200% since using CreatorApp.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "YouTuber",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", 
      content: "Finally, a tool that understands content creation. The automated scheduling feature alone saves me 10 hours a week.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-hero-gradient-from via-background to-hero-gradient-to relative overflow-hidden">
      {/* Background decoration with enhanced animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl animate-spin duration-[20s]"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 backdrop-blur-sm border border-border mb-8 hover:scale-105 transition-transform duration-200">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-sm text-text-secondary">New: Advanced AI Processing</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
            Transform Videos into
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient-x">
              Viral Content
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            Harness the power of AI to create engaging clips from your long-form videos.
            Schedule, publish, and optimize across all platforms with unprecedented precision.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={() => handleAuth('signup')}
              size="lg"
              className="text-lg px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 group"
            >
              <SparklesIcon className="w-5 h-5 mr-2 group-hover:animate-spin" />
              Start Creating for Free
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowVideoModal(true)}
              className="text-lg px-8 py-4 border-border hover:bg-surface/80 backdrop-blur-sm text-text-primary rounded-xl transition-all duration-200 group"
            >
              <PlayIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          <div className="text-center mb-4">
            <Button
              variant="ghost"
              onClick={() => handleAuth('signin')}
              className="text-text-muted hover:text-primary transition-colors"
            >
              Already have an account? Sign in
            </Button>
          </div>

          {/* Stats Section with animations */}
          <div className="flex flex-wrap justify-center gap-8 mb-20">
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="text-3xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">4.9★</div>
              <div className="text-sm text-text-muted">User Rating</div>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="text-3xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">50k+</div>
              <div className="text-sm text-text-muted">Active Creators</div>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="text-3xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">2M+</div>
              <div className="text-sm text-text-muted">Clips Generated</div>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-200">
              <div className="text-3xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">99.9%</div>
              <div className="text-sm text-text-muted">Uptime</div>
            </div>
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-20">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300 group-hover:scale-110`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Loved by <span className="text-primary">50,000+</span> creators
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              See how CreatorApp is transforming content creation workflows worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-text-secondary mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center">
                  <Image 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-text-primary">{testimonial.name}</div>
                    <div className="text-sm text-text-muted">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl p-12 border border-border/50">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Ready to 10x your content?
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using AI to grow their audience and revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => handleAuth('signup')}
              size="lg"
              className="text-lg px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAuth('signin')}
              size="lg"
              className="text-lg px-8 py-4 border-border hover:bg-surface/80 backdrop-blur-sm text-text-primary rounded-xl transition-all duration-200"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowAuthModal(false)}
          />
          <div className="relative bg-background border border-border rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <AuthForm
              mode={authMode}
              onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}

      {/* Video Demo Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowVideoModal(false)}
          />
          <div className="relative bg-black rounded-2xl max-w-4xl w-full mx-4 aspect-video">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <PlayIcon className="h-24 w-24 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Demo video coming soon!</p>
                <p className="text-gray-400 mt-2">Experience the full CreatorApp workflow</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
