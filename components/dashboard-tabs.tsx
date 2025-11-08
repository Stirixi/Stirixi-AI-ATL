'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardTabsProps {
  defaultTab?: string;
  teamView: ReactNode;
  projectsList: ReactNode;
  prospectiveHires: ReactNode;
}

export function DashboardTabs({
  defaultTab,
  teamView,
  projectsList,
  prospectiveHires,
}: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(defaultTab || 'team');

  // Sync with URL on mount and when search params change
  useEffect(() => {
    const tab = searchParams.get('tab') || defaultTab || 'team';
    setCurrentTab(tab);
  }, [searchParams, defaultTab]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    router.push(`/dashboard?tab=${value}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="team">Team View</TabsTrigger>
        <TabsTrigger value="projects">Projects View</TabsTrigger>
        <TabsTrigger value="prospective">Prospective Hires</TabsTrigger>
      </TabsList>
      <TabsContent value="team" className="mt-6">
        {teamView}
      </TabsContent>
      <TabsContent value="projects" className="mt-6">
        {projectsList}
      </TabsContent>
      <TabsContent value="prospective" className="mt-6">
        {prospectiveHires}
      </TabsContent>
    </Tabs>
  );
}
