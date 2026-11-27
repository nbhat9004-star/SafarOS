import GlobalEnterpriseLanding from '@/components/safaros/global-enterprise-landing';

export const metadata = {
  title: 'SafarOS — The Operating System for Travel Businesses',
  description: 'One intelligent platform to manage, grow and automate your travel business.',
  manifest: '/manifest.json',
};

export default function Page() {
  return <GlobalEnterpriseLanding />;
}
