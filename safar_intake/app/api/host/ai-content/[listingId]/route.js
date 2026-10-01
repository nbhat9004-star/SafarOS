import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = params;

    // Get current listing
    const listings = await getCollection('listings');
    const listing = await listings.findOne({ id: listingId, hostId: user.id });

    if (!listing) {
      return NextResponse.json({ ok: false, error: 'Listing not found' }, { status: 404 });
    }

    // Get saved AI content
    const aiContent = await getCollection('aiGeneratedContent');
    const savedContent = await aiContent.findOne({ listingId });

    if (!savedContent) {
      return NextResponse.json({ ok: true, content: null, hasChanges: false });
    }

    // Detect changes
    const snapshot = savedContent.listingSnapshot || {};
    const hasChanges = 
      listing.title !== snapshot.title ||
      listing.description !== snapshot.description ||
      listing.price !== snapshot.price ||
      JSON.stringify(listing.amenities || []) !== JSON.stringify(snapshot.amenities || []) ||
      (listing.images?.length || 0) !== (snapshot.imageCount || 0);

    return NextResponse.json({
      ok: true,
      content: savedContent,
      hasChanges,
      changes: hasChanges ? {
        title: listing.title !== snapshot.title,
        description: listing.description !== snapshot.description,
        price: listing.price !== snapshot.price,
        amenities: JSON.stringify(listing.amenities || []) !== JSON.stringify(snapshot.amenities || []),
        images: (listing.images?.length || 0) !== (snapshot.imageCount || 0),
      } : null,
    });

  } catch (error) {
    console.error('Get AI content error:', error);
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to retrieve content'
    }, { status: 500 });
  }
}
