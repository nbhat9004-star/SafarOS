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

const contentTypePrompts = {
  instagramCaption: 'Generate an engaging Instagram caption (100-150 words) with emojis, storytelling, and a call-to-action.',
  facebookCaption: 'Generate a Facebook post (150-200 words) with storytelling and community engagement.',
  reelScript: 'Generate an Instagram Reel script (15-30 seconds) with HOOK: / CONTENT: / CTA: format.',
  shortsScript: 'Generate a YouTube Shorts script (30-60 seconds) with HOOK: / VALUE: / CTA: format.',
  promoCaption: 'Generate a universal promotional caption (80-100 words) highlighting unique selling points.',
  seoTitle: 'Generate an SEO-optimized title (50-60 characters) with keywords.',
  metaDescription: 'Generate a meta description (150-160 characters) optimized for search engines.',
  hashtags: 'Generate 25-30 relevant hashtags mixing trending, niche, and location tags.',
  shortDescription: 'Generate a concise description (50-80 words) highlighting key features.',
  longDescription: 'Generate a detailed description (200-300 words) with sensory details and booking info.',
};

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, contentType } = await request.json();
    
    if (!contentTypePrompts[contentType]) {
      return NextResponse.json({ ok: false, error: 'Invalid content type' }, { status: 400 });
    }

    // Get listing and existing content
    const listings = await getCollection('listings');
    const listing = await listings.findOne({ id: listingId, hostId: user.id });
    
    if (!listing) {
      return NextResponse.json({ ok: false, error: 'Listing not found' }, { status: 404 });
    }

    const aiContent = await getCollection('aiGeneratedContent');
    const existingContent = await aiContent.findOne({ listingId });

    if (!existingContent) {
      return NextResponse.json({ ok: false, error: 'No existing content found' }, { status: 404 });
    }

    // Create specific prompt
    const prompt = `You are a professional marketing copywriter. For this property:

**Property:**
- Title: ${listing.title}
- Location: ${listing.location}
- Price: ₹${listing.price}/night
- Description: ${listing.description || 'Beautiful property'}
- Type: ${listing.category}
- Amenities: ${listing.amenities?.join(', ') || 'Multiple'}

${contentTypePrompts[contentType]}

Return ONLY the generated text content, no JSON, no markdown, no extra formatting.`;

    // Call Gemini
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
    const generatedText = result.response.text().trim();

    // Update specific content type
    const updatedContent = {
      ...existingContent,
      content: {
        ...existingContent.content,
        [contentType]: generatedText,
      },
      [`lastRegenerated_${contentType}`]: new Date(),
    };

    await aiContent.updateOne(
      { listingId },
      { $set: updatedContent }
    );

    return NextResponse.json({ ok: true, content: updatedContent });

  } catch (error) {
    console.error('Regenerate error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to regenerate content' 
    }, { status: 500 });
  }
}
