import { redirect } from 'next/navigation';

// The legacy `(social)` Explore experience has been superseded by the premium
// Travel Buddy UI at `/explore`. Every route inside this group now forwards
// to the new page so no old layout can render anywhere.
export const metadata = {
  title: 'Explore — Safar Curated',
};

export default function LegacyExploreGroupLayout() {
  redirect('/explore');
}
