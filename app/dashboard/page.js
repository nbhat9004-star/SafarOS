import { AppExperience } from '@/components/safaros/app-experience';

export const metadata = { title: 'SafarOS — Workspace' };

export default function Page() {
  return <AppExperience initialTab="login" />;
}
