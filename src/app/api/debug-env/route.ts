import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY
  
  return NextResponse.json({
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyFirst20: apiKey?.substring(0, 20) || '',
    keyLast10: apiKey?.substring(apiKey?.length - 10) || '',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
    nodeEnv: process.env.NODE_ENV,
    environment: {
      hasEnvLocal: 'checking...',
      envFiles: 'checking...'
    }
  })
}
