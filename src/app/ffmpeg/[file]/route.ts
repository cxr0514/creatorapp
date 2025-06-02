import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fileName = path.basename(url.pathname)

    if (!fileName.startsWith('ffmpeg-core.')) {
      return NextResponse.json({ error: 'Invalid file request' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'node_modules', '@ffmpeg', 'core-mt', 'dist', fileName)
    const fileContent = await fs.readFile(filePath)

    const headers = new Headers()
    if (fileName.endsWith('.js')) {
      headers.set('Content-Type', 'text/javascript')
    } else if (fileName.endsWith('.wasm')) {
      headers.set('Content-Type', 'application/wasm')
    }
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

    return new NextResponse(fileContent, { headers })
  } catch (error) {
    console.error('Error serving FFmpeg file:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
