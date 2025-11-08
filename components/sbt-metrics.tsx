import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain } from "lucide-react"

export function SBTMetrics({ engineerId }: { engineerId: string }) {
  // Mock SBT (Skills-Based Training) data
  const sbtData = {
    overall: {
      score: 87,
      level: "Advanced",
      progress: 72,
      nextMilestone: "Expert",
    },
    categories: [
      {
        name: "Technical Proficiency",
        score: 92,
        level: "Expert",
        skills: [
          { name: "React/TypeScript", proficiency: 95, hours: 1240 },
          { name: "Node.js Backend", proficiency: 88, hours: 980 },
          { name: "System Design", proficiency: 85, hours: 640 },
        ],
      },
      {
        name: "Code Quality",
        score: 89,
        level: "Advanced",
        skills: [
          { name: "Code Reviews", proficiency: 92, hours: 420 },
          { name: "Testing", proficiency: 86, hours: 560 },
          { name: "Documentation", proficiency: 83, hours: 280 },
        ],
      },
      {
        name: "Collaboration",
        score: 84,
        level: "Advanced",
        skills: [
          { name: "PR Reviews", proficiency: 88, hours: 340 },
          { name: "Mentoring", proficiency: 82, hours: 180 },
          { name: "Communication", proficiency: 81, hours: 220 },
        ],
      },
      {
        name: "Velocity",
        score: 82,
        level: "Intermediate",
        skills: [
          { name: "Delivery Speed", proficiency: 85, hours: 890 },
          { name: "Task Management", proficiency: 79, hours: 450 },
          { name: "Priority Handling", proficiency: 80, hours: 380 },
        ],
      },
    ],
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Skills-Based Training (SBT) Metrics</h2>
          <Badge variant="default" className="text-sm">
            {sbtData.overall.level}
          </Badge>
        </div>

        {/* Overall Score */}
        <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-3xl font-bold text-foreground">{sbtData.overall.score}</p>
              <p className="text-sm text-muted-foreground">Overall SBT Score</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {sbtData.overall.nextMilestone}</span>
              <span className="text-foreground font-medium">{sbtData.overall.progress}%</span>
            </div>
            <Progress value={sbtData.overall.progress} className="h-2" />
          </div>
        </div>

        {/* Categories */}
        <Tabs defaultValue="technical" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
          </TabsList>

          {sbtData.categories.map((category, index) => (
            <TabsContent
              key={category.name}
              value={["technical", "quality", "collaboration", "velocity"][index]}
              className="mt-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">Level: {category.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{category.score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>

              <div className="space-y-3">
                {category.skills.map((skill) => (
                  <div key={skill.name} className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">{skill.hours} hours logged</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{skill.proficiency}%</p>
                        <p className="text-xs text-muted-foreground">Proficiency</p>
                      </div>
                    </div>
                    <Progress value={skill.proficiency} className="h-2" />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  )
}
