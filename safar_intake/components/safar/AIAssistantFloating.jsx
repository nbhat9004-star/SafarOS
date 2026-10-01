'use client';
// AI Concierge floating button — removed per navigation redesign.
// Users now access AI via the "AI Planner" navigation item in the bottom nav.
// Kept as a no-op export so the pages that already import it (page.js,
// dashboard/traveler, wishlist, property/[id], explore, GuideLayout) continue
// to compile without any changes to those files.
export default function AIAssistantFloating() {
  return null;
}
