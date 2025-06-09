import { NextResponse } from 'next/server'
import { openai, isAIAvailable } from '@/lib/ai/openai-client'

export async function GET() {
  try {
    console.log('Testing OpenAI integration...')
    
    // Check if AI is available
    if (!isAIAvailable()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'AI service is not available. Please configure OPENAI_API_KEY.',
          hasApiKey: !!process.env.OPENAI_API_KEY,
          keyLength: process.env.OPENAI_API_KEY?.length || 0
        },
        { status: 503 }
      )
    }

    const client = openai()
    
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are a helpful assistant. Respond with exactly: 'OpenAI integration test successful!'"
        },
        {
          role: "user", 
          content: "Test message"
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    })
    
    const response = completion.choices[0]?.message?.content
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI integration test completed',
      aiResponse: response,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      isWorking: response?.includes('successful')
    })
    
  } catch (error) {
    console.error('OpenAI test error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorType = error instanceof Error ? error.constructor.name : 'Unknown'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      errorType: errorType
    }, { status: 500 })
  }
}
