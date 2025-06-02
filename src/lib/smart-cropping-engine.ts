// Advanced Smart Cropping Engine for Phase 3 Implementation
import { ExportFormat, CropSettings } from './video-export';

export interface SmartCropAnalysis {
  confidence: number;
  strategy: string;
  focusArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  reasoning: string;
  fallbackStrategy?: string;
}

export interface ContentAnalysis {
  faceDetection: {
    detected: boolean;
    count: number;
    primaryFace?: {
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
    };
    faces: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
    }>;
  };
  motionAnalysis: {
    hasSignificantMotion: boolean;
    motionCenters: Array<{
      x: number;
      y: number;
      intensity: number;
      timeRange: {
        start: number;
        end: number;
      };
    }>;
    dominantDirection: 'horizontal' | 'vertical' | 'none';
  };
  objectDetection: {
    objects: Array<{
      label: string;
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    mainSubject?: {
      label: string;
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
  };
  sceneAnalysis: {
    brightness: number;
    contrast: number;
    colorDistribution: {
      dominant: string;
      palette: string[];
    };
    composition: {
      type: 'rule-of-thirds' | 'centered' | 'dynamic' | 'unbalanced';
      confidence: number;
    };
  };
}

export interface SmartCroppingOptions {
  enableFaceDetection: boolean;
  enableMotionTracking: boolean;
  enableObjectDetection: boolean;
  enableSceneAnalysis: boolean;
  confidenceThreshold: number;
  prioritizeMovement: boolean;
  preserveMainSubject: boolean;
  avoidEdgeCutoff: boolean;
}

export class SmartCroppingEngine {
  private static instance: SmartCroppingEngine;
  private apiKey: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  static getInstance(apiKey?: string): SmartCroppingEngine {
    if (!SmartCroppingEngine.instance) {
      SmartCroppingEngine.instance = new SmartCroppingEngine(apiKey);
    }
    return SmartCroppingEngine.instance;
  }

  /**
   * Analyzes video content for smart cropping decisions
   */
  async analyzeContent(): Promise<ContentAnalysis> {
    // Simulate content analysis for now
    // In production, this would call actual AI services
    return this.simulateContentAnalysis();
  }

  /**
   * Determines the optimal cropping strategy based on content analysis
   */
  async determineCroppingStrategy(
    sourceAspectRatio: string,
    targetFormat: ExportFormat,
    contentAnalysis: ContentAnalysis,
    options: Partial<SmartCroppingOptions> = {}
  ): Promise<SmartCropAnalysis> {
    const sourceRatio = this.parseAspectRatio(sourceAspectRatio);
    const targetRatio = targetFormat.width / targetFormat.height;
    
    // If ratios are similar, minimal cropping needed
    if (Math.abs(sourceRatio - targetRatio) < 0.1) {
      return {
        confidence: 0.95,
        strategy: 'center',
        focusArea: { x: 0.5, y: 0.5, width: 1, height: 1 },
        reasoning: 'Source and target aspect ratios are similar, center crop is optimal'
      };
    }

    // Analyze content to determine best strategy
    return this.analyzeOptimalCrop(sourceRatio, targetRatio, contentAnalysis, targetFormat, options);
  }

  /**
   * Generates Cloudinary transformation parameters for smart cropping
   */
  generateCloudinaryTransformation(
    smartCropAnalysis: SmartCropAnalysis,
    targetFormat: ExportFormat,
    startTime?: number,
    endTime?: number
  ): string {
    const transformations: string[] = [];

    // Video trimming
    if (startTime !== undefined && endTime !== undefined) {
      transformations.push(`so_${startTime},eo_${endTime}`);
    }

    // Base transformation
    transformations.push(`c_fill`);
    transformations.push(`w_${targetFormat.width},h_${targetFormat.height}`);
    transformations.push(`ar_${targetFormat.aspectRatio}`);

    // Apply smart cropping strategy
    switch (smartCropAnalysis.strategy) {
      case 'face':
        transformations.push('g_face');
        if (smartCropAnalysis.confidence < 0.8 && smartCropAnalysis.fallbackStrategy) {
          transformations.push(`g_${smartCropAnalysis.fallbackStrategy}`);
        }
        break;

      case 'motion-tracking':
        transformations.push('g_auto:subject');
        break;

      case 'smart':
        transformations.push('g_auto');
        break;

      case 'rule-of-thirds':
        transformations.push('g_auto:classic');
        break;

      case 'custom':
        // Use custom focus area
        const { x, y } = smartCropAnalysis.focusArea;
        transformations.push(`g_xy_center`);
        transformations.push(`x_${Math.round(x * targetFormat.width)}`);
        transformations.push(`y_${Math.round(y * targetFormat.height)}`);
        break;

      default:
        transformations.push('g_center');
    }

    // Quality and format optimization
    transformations.push('q_auto:good');
    transformations.push('f_mp4');

    return transformations.join(',');
  }

  /**
   * Provides recommendations for improving crop quality
   */
  getCroppingRecommendations(
    smartCropAnalysis: SmartCropAnalysis,
    contentAnalysis: ContentAnalysis
  ): string[] {
    const recommendations: string[] = [];

    if (smartCropAnalysis.confidence < 0.7) {
      recommendations.push('Low confidence detected - consider manual adjustment');
    }

    if (contentAnalysis.faceDetection.detected && contentAnalysis.faceDetection.count > 1) {
      recommendations.push('Multiple faces detected - verify primary subject focus');
    }

    if (contentAnalysis.motionAnalysis.hasSignificantMotion) {
      recommendations.push('Significant motion detected - consider motion tracking for dynamic content');
    }

    if (contentAnalysis.sceneAnalysis.brightness < 0.3) {
      recommendations.push('Low light content - may benefit from brightness adjustment');
    }

    if (contentAnalysis.objectDetection.objects.length > 5) {
      recommendations.push('Complex scene detected - smart crop may help focus on main subject');
    }

    return recommendations;
  }

  private async simulateContentAnalysis(): Promise<ContentAnalysis> {
    // Simulate AI analysis with realistic data
    // In production, this would make actual API calls to AI services
    
    const hasFaces = Math.random() > 0.5;
    const hasMotion = Math.random() > 0.4;

    return {
      faceDetection: {
        detected: hasFaces,
        count: hasFaces ? Math.floor(Math.random() * 3) + 1 : 0,
        primaryFace: hasFaces ? {
          x: 0.3 + Math.random() * 0.4,
          y: 0.2 + Math.random() * 0.3,
          width: 0.15 + Math.random() * 0.2,
          height: 0.2 + Math.random() * 0.25,
          confidence: 0.7 + Math.random() * 0.3
        } : undefined,
        faces: hasFaces ? [{
          x: 0.3 + Math.random() * 0.4,
          y: 0.2 + Math.random() * 0.3,
          width: 0.15 + Math.random() * 0.2,
          height: 0.2 + Math.random() * 0.25,
          confidence: 0.7 + Math.random() * 0.3
        }] : []
      },
      motionAnalysis: {
        hasSignificantMotion: hasMotion,
        motionCenters: hasMotion ? [{
          x: 0.3 + Math.random() * 0.4,
          y: 0.3 + Math.random() * 0.4,
          intensity: 0.5 + Math.random() * 0.5,
          timeRange: { start: 0, end: 30 }
        }] : [],
        dominantDirection: hasMotion ? 
          (Math.random() > 0.5 ? 'horizontal' : 'vertical') : 'none'
      },
      objectDetection: {
        objects: [
          {
            label: 'person',
            confidence: 0.8 + Math.random() * 0.2,
            boundingBox: {
              x: 0.2 + Math.random() * 0.3,
              y: 0.1 + Math.random() * 0.3,
              width: 0.3 + Math.random() * 0.3,
              height: 0.5 + Math.random() * 0.4
            }
          }
        ],
        mainSubject: {
          label: 'person',
          confidence: 0.85,
          boundingBox: {
            x: 0.25,
            y: 0.15,
            width: 0.4,
            height: 0.6
          }
        }
      },
      sceneAnalysis: {
        brightness: 0.4 + Math.random() * 0.4,
        contrast: 0.3 + Math.random() * 0.4,
        colorDistribution: {
          dominant: ['blue', 'red', 'green', 'yellow'][Math.floor(Math.random() * 4)],
          palette: ['#FF5733', '#33A1FF', '#33FF57', '#FFD133']
        },
        composition: {
          type: Math.random() > 0.5 ? 'rule-of-thirds' : 'centered',
          confidence: 0.6 + Math.random() * 0.4
        }
      }
    };
  }

  private analyzeOptimalCrop(
    sourceRatio: number,
    targetRatio: number,
    contentAnalysis: ContentAnalysis,
    targetFormat: ExportFormat,
    _options: Partial<SmartCroppingOptions>
  ): SmartCropAnalysis {
    let strategy = 'center';
    let confidence = 0.5;
    let reasoning = 'Default center crop';
    let focusArea = { x: 0.5, y: 0.5, width: 1, height: 1 };
    let fallbackStrategy: string | undefined;

    // Face detection priority for portrait formats
    if (targetFormat.format === '9:16' && contentAnalysis.faceDetection.detected) {
      strategy = 'face';
      confidence = contentAnalysis.faceDetection.primaryFace?.confidence || 0.7;
      reasoning = 'Face detected, using face-centered crop for vertical format';
      
      if (contentAnalysis.faceDetection.primaryFace) {
        const face = contentAnalysis.faceDetection.primaryFace;
        focusArea = {
          x: face.x + face.width / 2,
          y: face.y + face.height / 2,
          width: face.width * 1.5,
          height: face.height * 2
        };
      }
      fallbackStrategy = 'center';
    }
    // Motion tracking for action content
    else if (contentAnalysis.motionAnalysis.hasSignificantMotion && _options.prioritizeMovement) {
      strategy = 'motion-tracking';
      confidence = 0.8;
      reasoning = 'Significant motion detected, using motion tracking';
      
      if (contentAnalysis.motionAnalysis.motionCenters.length > 0) {
        const motion = contentAnalysis.motionAnalysis.motionCenters[0];
        focusArea = {
          x: motion.x,
          y: motion.y,
          width: 0.6,
          height: 0.6
        };
      }
      fallbackStrategy = 'smart';
    }
    // Smart crop for complex scenes
    else if (contentAnalysis.objectDetection.objects.length > 2) {
      strategy = 'smart';
      confidence = 0.75;
      reasoning = 'Complex scene detected, using AI smart crop';
      
      if (contentAnalysis.objectDetection.mainSubject) {
        const subject = contentAnalysis.objectDetection.mainSubject.boundingBox;
        focusArea = {
          x: subject.x + subject.width / 2,
          y: subject.y + subject.height / 2,
          width: subject.width * 1.2,
          height: subject.height * 1.2
        };
      }
      fallbackStrategy = 'center';
    }
    // Rule of thirds for artistic content
    else if (contentAnalysis.sceneAnalysis.composition.type === 'rule-of-thirds' &&
             contentAnalysis.sceneAnalysis.composition.confidence > 0.7) {
      strategy = 'rule-of-thirds';
      confidence = contentAnalysis.sceneAnalysis.composition.confidence;
      reasoning = 'Good composition detected, using rule of thirds';
      fallbackStrategy = 'center';
    }

    // Adjust confidence based on various factors
    if (Math.abs(sourceRatio - targetRatio) > 1) {
      confidence *= 0.9; // Reduce confidence for dramatic aspect ratio changes
    }

    if (contentAnalysis.sceneAnalysis.brightness < 0.3) {
      confidence *= 0.8; // Reduce confidence for low light
    }

    return {
      confidence: Math.min(confidence, 0.95),
      strategy,
      focusArea,
      reasoning,
      fallbackStrategy
    };
  }

  private parseAspectRatio(aspectRatio: string): number {
    const [width, height] = aspectRatio.split(':').map(Number);
    return width / height;
  }
}

// Export utilities for easy access
export const smartCroppingEngine = SmartCroppingEngine.getInstance();

export function createSmartCropSettings(
  strategy: string,
  confidence: number = 0.8,
  focusArea?: { x: number; y: number; width: number; height: number }
): CropSettings {
  const settings: CropSettings = {
    type: strategy as CropSettings['type'],
    confidence
  };

  if (focusArea) {
    settings.x = focusArea.x;
    settings.y = focusArea.y;
  }

  return settings;
}

export function getContentTypeFromAnalysis(analysis: ContentAnalysis): 'portrait' | 'landscape' | 'action' | 'presentation' | 'general' {
  if (analysis.faceDetection.detected && analysis.faceDetection.count === 1) {
    return 'portrait';
  }
  
  if (analysis.motionAnalysis.hasSignificantMotion) {
    return 'action';
  }
  
  if (analysis.faceDetection.detected && analysis.faceDetection.count > 1) {
    return 'presentation';
  }
  
  if (analysis.sceneAnalysis.composition.type === 'rule-of-thirds') {
    return 'landscape';
  }
  
  return 'general';
}