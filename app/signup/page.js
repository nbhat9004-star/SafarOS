import { AppExperience } from '@/components/safaros/app-experience';

export const metadata = { title: 'Start free — SafarOS' };

export default function Page() {
  return <AppExperience initialTab="signup" />;
}
