import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const currentApiKey = process.env.OPENAI_API_KEY
  
  // Read directly from files
  let envLocalKey = null
  let envKey = null
  
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf8')
      const match = content.match(/OPENAI_API_KEY=(.+)/)
      if (match) {
        envLocalKey = match[1].trim()
      }
    }
  } catch (e) {
    console.error('Error reading .env.local:', e)
  }
  
  try {
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const match = content.match(/OPENAI_API_KEY=(.+)/)
      if (match) {
        envKey = match[1].trim()
      }
    }
  } catch (e) {
    console.error('Error reading .env:', e)
  }
  
  return NextResponse.json({
    processEnv: {
      hasKey: !!currentApiKey,
      keyLength: currentApiKey?.length || 0,
      keyFirst20: currentApiKey?.substring(0, 20) || '',
      keyLast10: currentApiKey?.substring(currentApiKey?.length - 10) || '',
    },
    fileContents: {
      envLocal: {
        hasKey: !!envLocalKey,
        keyLength: envLocalKey?.length || 0,
        keyFirst20: envLocalKey?.substring(0, 20) || '',
        keyLast10: envLocalKey?.substring(envLocalKey?.length - 10) || '',
      },
      env: {
        hasKey: !!envKey,
        keyLength: envKey?.length || 0,
        keyFirst20: envKey?.substring(0, 20) || '',
        keyLast10: envKey?.substring(envKey?.length - 10) || '',
      }
    },
    isPlaceholder: currentApiKey === 'your-openai-api-key-here'
  })
}
