/**
 * AIRecommendations Component
 * Displays AI-generated insights and recommendations for content optimization
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Hash, 
  Palette, 
  Target,
  CheckCircle,
  X 
} from 'lucide-react'
import type { AIRecommendation, ImpactLevel } from '@/lib/types/analytics'
import { IMPACT_COLORS } from '@/lib/analytics-constants'
import { useState } from 'react'

interface AIRecommendationsProps {
  recommendations: AIRecommendation[]
  isLoading?: boolean
  onApplyRecommendation?: (recommendationId: string) => void
  onDismissRecommendation?: (recommendationId: string) => void
}

interface RecommendationCardProps {
  recommendation: AIRecommendation
  onApply?: (id: string) => void
  onDismiss?: (id: string) => void
}

const RECOMMENDATION_ICONS = {
  length: Clock,
  style: Palette,
  tags: Hash,
  trending: TrendingUp
} as const

function getImpactColor(impact: ImpactLevel): string {
  return IMPACT_COLORS[impact] || IMPACT_COLORS.low
}

function RecommendationCard({ recommendation, onApply, onDismiss }: RecommendationCardProps) {
  const [isApplied, setIsApplied] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  
  const Icon = RECOMMENDATION_ICONS[recommendation.type] || Lightbulb
  const impactColor = getImpactColor(recommendation.impact)

  const handleApply = () => {
    setIsApplied(true)
    onApply?.(recommendation.id)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.(recommendation.id)
  }

  if (isDismissed) {
    return null
  }

  return (
    <Card className={`transition-all duration-300 ${isApplied ? 'border-green-200 bg-green-50' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${isApplied ? 'bg-green-100' : 'bg-blue-50'}`}>
              {isApplied ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Icon className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-base font-semibold text-card-foreground">
                  {recommendation.title}
                </CardTitle>
                <Badge className={`text-xs font-medium ${impactColor}`}>
                  {recommendation.impact} impact
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.description}
              </p>
            </div>
          </div>
          
          {!isApplied && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1 h-auto opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {recommendation.estimatedImprovement}
            </span>
          </div>
          
          {!isApplied && onApply && (
            <Button 
              size="sm" 
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply Suggestion
            </Button>
          )}
          
          {isApplied && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Applied</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonRecommendationCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            </div>
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AIRecommendations({ 
  recommendations, 
  isLoading = false, 
  onApplyRecommendation,
  onDismissRecommendation 
}: AIRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-card-foreground">AI Recommendations</h2>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRecommendationCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm text-muted-foreground mb-1">No recommendations available</p>
          <p className="text-xs text-muted-foreground">
            AI is analyzing your content performance to generate insights
          </p>
        </CardContent>
      </Card>
    )
  }

  const highImpactCount = recommendations.filter(r => r.impact === 'high').length
  const mediumImpactCount = recommendations.filter(r => r.impact === 'medium').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Recommendations</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized suggestions to improve your content performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-xs">
          {highImpactCount > 0 && (
            <Badge className={IMPACT_COLORS.high}>
              {highImpactCount} High Impact
            </Badge>
          )}
          {mediumImpactCount > 0 && (
            <Badge className={IMPACT_COLORS.medium}>
              {mediumImpactCount} Medium Impact
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onApply={onApplyRecommendation}
            onDismiss={onDismissRecommendation}
          />
        ))}
      </div>
    </div>
  )
}
