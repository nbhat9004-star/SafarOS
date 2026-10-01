import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCollection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Lazy-load Gemini client to avoid initialization errors
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.EMERGENT_LLM_KEY;
  if (!apiKey) {
    throw new Error('AI service is not configured. Please contact support.');
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();
    
    // Get listing details
    const listings = await getCollection('listings');
    const listing = await listings.findOne({ id: listingId, hostId: user.id });
    
    if (!listing) {
      return NextResponse.json({ ok: false, error: 'Listing not found' }, { status: 404 });
    }

    // Create comprehensive prompt for Gemini
    const prompt = `You are a professional marketing copywriter for luxury travel and accommodations. Generate comprehensive marketing content for the following property:

**Property Details:**
- Title: ${listing.title}
- Location: ${listing.location}
- Price: ₹${listing.price}/night
- Description: ${listing.description || 'Beautiful property in Kashmir'}
- Property Type: ${listing.category || 'stay'}
- Amenities: ${listing.amenities?.join(', ') || 'Multiple amenities'}
- Guests: ${listing.guests || 'Multiple guests'}

Generate the following content types in JSON format:

1. **instagramCaption**: An engaging Instagram caption (100-150 words) with emojis, storytelling, and a call-to-action. Make it emotional and visual.

2. **facebookCaption**: A longer Facebook post (150-200 words) with more storytelling, details about the experience, and community engagement.

3. **reelScript**: An Instagram Reel script (15-30 seconds) with hook, content, and CTA. Format: HOOK: / CONTENT: / CTA:

4. **shortsScript**: A YouTube Shorts script (30-60 seconds) focused on value and discovery. Format: HOOK: / VALUE: / CTA:

5. **promoCaption**: A universal promotional caption (80-100 words) that works across platforms. Focus on unique selling points.

6. **seoTitle**: An SEO-optimized title (50-60 characters) with primary keywords for Kashmir travel.

7. **metaDescription**: A meta description (150-160 characters) optimized for search engines with keywords and CTA.

8. **hashtags**: 25-30 relevant hashtags mixing trending, niche, and location-based tags. Include #Kashmir #Travel #Luxury etc.

9. **shortDescription**: A concise promotional description (50-80 words) highlighting key features and benefits.

10. **longDescription**: A detailed promotional description (200-300 words) with sensory details, experience description, amenities, and booking information.

Return ONLY valid JSON in this exact format with no markdown or extra text:
{
  "instagramCaption": "text here",
  "facebookCaption": "text here",
  "reelScript": "text here",
  "shortsScript": "text here",
  "promoCaption": "text here",
  "seoTitle": "text here",
  "metaDescription": "text here",
  "hashtags": "text here",
  "shortDescription": "text here",
  "longDescription": "text here"
}`;

    // Call Gemini API
    let genAI;
    try {
      genAI = getGeminiClient();
    } catch (error) {
      console.error('Gemini client initialization error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'AI service is temporarily unavailable. Please try again later or contact support.' 
      }, { status: 503 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON response
    let generatedContent;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedContent = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ ok: false, error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Create listing snapshot for change detection
    const listingSnapshot = {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      amenities: listing.amenities || [],
      imageCount: listing.images?.length || 0,
    };

    // Save to database
    const aiContent = await getCollection('aiGeneratedContent');
    const contentDoc = {
      id: `ai-${Date.now()}`,
      listingId: listing.id,
      hostId: user.id,
      content: generatedContent,
      generatedAt: new Date(),
      listingSnapshot,
    };

    await aiContent.updateOne(
      { listingId: listing.id },
      { $set: contentDoc },
      { upsert: true }
    );

    return NextResponse.json({ 
      ok: true, 
      content: contentDoc 
    });

  } catch (error) {
    console.error('AI content generation error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to generate content' 
    }, { status: 500 });
  }
}
