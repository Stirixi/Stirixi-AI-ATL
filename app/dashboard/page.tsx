import { AppHeader } from "@/components/app-header"
import { DashboardOverview } from "@/components/dashboard-overview"
import { TeamView } from "@/components/team-view"
import { ProjectsList } from "@/components/projects-list"
import { ProspectiveHires } from "@/components/prospective-hires"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your engineering metrics and team performance</p>
          </div>

          <DashboardOverview />

          <Tabs defaultValue="team" className="w-full">
            <TabsList>
              <TabsTrigger value="team">Team View</TabsTrigger>
              <TabsTrigger value="projects">Projects View</TabsTrigger>
              <TabsTrigger value="prospective">Prospective Hires</TabsTrigger>
            </TabsList>
            <TabsContent value="team" className="mt-6">
              <TeamView />
            </TabsContent>
            <TabsContent value="projects" className="mt-6">
              <ProjectsList />
            </TabsContent>
            <TabsContent value="prospective" className="mt-6">
              <ProspectiveHires />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
