// Simple OpenAI test without authentication
import OpenAI from 'openai';

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API directly...\n');
  
  // Read the API key from .env.local manually
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    const envContent = fs.default.readFileSync(path.default.join(process.cwd(), '.env'), 'utf8');
    const apiKeyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);
    
    if (!apiKeyMatch || !apiKeyMatch[1]) {
      console.log('❌ No OpenAI API key found in .env');
      return;
    }
    
    const apiKey = apiKeyMatch[1].trim();
    console.log('✅ Found API key:', apiKey.substring(0, 20) + '...');
    console.log('✅ Key length:', apiKey.length);
    
    const client = new OpenAI({ apiKey });
    
    console.log('\n🚀 Testing AI generation...');
    
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
    });
    
    const response = completion.choices[0]?.message?.content;
    console.log('✅ AI Response:', response);
    
    if (response?.includes('successful')) {
      console.log('\n🎉 OpenAI integration is working perfectly!');
      console.log('💡 Your CreatorApp is ready for AI-powered features!');
    } else {
      console.log('\n⚠️  AI responded but with unexpected content');
    }
    
  } catch (error) {
    console.error('\n❌ OpenAI test failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('401')) {
      console.log('   → Check your API key is valid and has the correct permissions');
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
      console.log('   → Check your OpenAI account has available credits');
    } else if (error.message.includes('rate')) {
      console.log('   → Rate limit exceeded, try again in a moment');
    }
  }
}

testOpenAI();
