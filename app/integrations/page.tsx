import { AppHeader } from '@/components/app-header';
import { OnboardingPanel } from '@/components/onboarding-panel';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function IntegrationsPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login?next=/integrations')
  }
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8 flex justify-center items-start min-h-[calc(100vh-80px)]">
        <div className="max-w-2xl w-full mt-12">
          <OnboardingPanel />
        </div>
      </main>
    </div>
  );
}
