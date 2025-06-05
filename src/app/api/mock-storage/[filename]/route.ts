import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    const mockStorageDir = path.join(process.cwd(), 'mock-storage')
    const filePath = path.join(mockStorageDir, filename)

    // Security check: ensure the file is within mock storage directory
    if (!filePath.startsWith(mockStorageDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.mp4':
        contentType = 'video/mp4'
        break
      case '.webm':
        contentType = 'video/webm'
        break
      case '.mov':
        contentType = 'video/quicktime'
        break
      case '.avi':
        contentType = 'video/x-msvideo'
        break
      default:
        contentType = 'application/octet-stream'
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error serving mock storage file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 