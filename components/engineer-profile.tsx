import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Github } from "lucide-react"

export function EngineerProfile({
  engineerId,
  isProspective = false,
}: { engineerId: string; isProspective?: boolean }) {
  // Mock data - in production this would come from an API
  const engineer = isProspective
    ? {
        name: "David Park",
        role: "Senior Frontend Engineer",
        email: "david.park@email.com",
        github: "@davidpark",
        status: "Interview Scheduled",
        joinDate: "Applied: Jan 5, 2024",
        skills: ["React", "TypeScript", "Next.js", "Tailwind", "GraphQL"],
      }
    : {
        name: "Sarah Chen",
        role: "Senior Engineer",
        email: "sarah.chen@company.com",
        github: "@sarahchen",
        status: "active",
        joinDate: "Jan 2023",
        skills: ["React", "TypeScript", "Node.js", "Python", "AWS"],
      }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {engineer.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{engineer.name}</h1>
                <Badge variant={engineer.status === "active" ? "default" : "secondary"}>{engineer.status}</Badge>
              </div>
              <p className="text-muted-foreground">{engineer.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{engineer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{engineer.github}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">{isProspective ? "" : "Joined: "}</span>
              <span className="text-foreground">{engineer.joinDate}</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {engineer.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
