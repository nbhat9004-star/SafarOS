import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Safar AI Concierge, a Kashmir travel expert. Help travelers plan amazing trips to Kashmir with detailed, personalized recommendations.

**Capabilities:**
- Create detailed day-by-day itineraries
- Suggest accommodations, activities, experiences
- Provide budget estimates in Indian Rupees (₹)
- Compare destinations (Srinagar, Gulmarg, Pahalgam, Sonmarg)
- Recommend activities based on season and interests
- Offer local insights and cultural tips
- Plan family trips, honeymoons, adventure tours

**Kashmir Highlights:**
- Srinagar: Dal Lake, Mughal Gardens, houseboats, Shikara rides
- Gulmarg: Gondola cable car, skiing, snow activities
- Pahalgam: Aru Valley, Betaab Valley, trekking
- Sonmarg: Thajiwas Glacier, meadows, pony rides
- Local: Wazwan feast, Kahwa tea, crafts

**Guidelines:**
- Be warm, friendly, and enthusiastic
- Provide specific, actionable recommendations
- Include costs in ₹
- Consider travel logistics and distances
- Structure itineraries by day (morning, afternoon, evening)
- Mention best seasons: April-October (most areas), Dec-Feb (snow)

Provide helpful, detailed travel advice that makes Kashmir accessible and exciting!`;

export async function POST(request) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use gemini-2.5-flash (the latest free model)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
    });

    // Build conversation with system context
    const fullMessage = `${SYSTEM_PROMPT}\n\nUser: ${message}`;
    
    // If there's conversation history, include it
    let contextMessage = fullMessage;
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');
      contextMessage = `${SYSTEM_PROMPT}\n\n${recentHistory}\n\nUser: ${message}`;
    }

    // Generate content
    const result = await model.generateContent(contextMessage);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      reply: text,
      model: 'gemini-2.5-flash',
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    console.error('[AI Chat] Error details:', error.message);
    
    // Handle specific Gemini errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please check API key.' },
        { status: 500 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'AI service is busy. Please try again in a moment.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'AI model not available. Please contact support.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Failed to get AI response: ${error.message}` },
      { status: 500 }
    );
  }
}
