import { redirect } from 'next/navigation';

// Legacy /explore/home URL — permanently forward to the new premium Explore UI.
export default function ExploreHomeRedirect() {
  redirect('/explore');
}
