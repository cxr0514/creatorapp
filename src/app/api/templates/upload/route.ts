import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { uploadTemplateAsset } from '@/lib/b2'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const assetType = formData.get('assetType') as 'logo' | 'intro' | 'outro'
    const userId = formData.get('userId') as string

    if (!file || !assetType || !userId) {
      return NextResponse.json(
        { error: 'File, asset type, and user ID are required' },
        { status: 400 }
      )
    }

    if (!['logo', 'intro', 'outro'].includes(assetType)) {
      return NextResponse.json(
        { error: 'Asset type must be logo, intro, or outro' },
        { status: 400 }
      )
    }

    // Validate file type based on asset type
    if (assetType === 'logo' && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Logo must be an image file' },
        { status: 400 }
      )
    }

    if ((assetType === 'intro' || assetType === 'outro') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Intro and outro must be video files' },
        { status: 400 }
      )
    }

    const result = await uploadTemplateAsset(file, assetType, userId)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error uploading template asset:', error)
    return NextResponse.json(
      { error: 'Failed to upload template asset' },
      { status: 500 }
    )
  }
}
