"use client"

import { Card } from "@/components/ui/card"
import { GitPullRequest, Calendar, Bug, Clock, DollarSign, Sparkles } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

function getPerformanceColor(score: number): string {
  if (score >= 7.5) {
    return "text-green-500"
  } else if (score >= 5.0) {
    return "text-yellow-500"
  } else {
    return "text-red-500"
  }
}

export function EngineerMetrics({
  engineerId,
  isProspective = false,
}: { engineerId: string; isProspective?: boolean }) {
  const [promptHistoryOpen, setPromptHistoryOpen] = useState(false)

  const metrics = {
    engineer: {
      prsMerged: 12,
      estimationAccuracy: -2.3, // negative means underestimated (days)
      bugsGenerated: 3,
      avgReviewTime: "4.2h",
      aiSpend: 45.2,
      performance: 8.7,
    },
    companyAvg: {
      prsMerged: 9,
      estimationAccuracy: -1.8,
      bugsGenerated: 5,
      avgReviewTime: "6.5h",
      aiSpend: 52.0,
      performance: 7.5,
    },
  }

  const performanceHistory = [
    { month: "Jan", engineer: 8.2, company: 7.3 },
    { month: "Feb", engineer: 8.5, company: 7.4 },
    { month: "Mar", engineer: 8.7, company: 7.5 },
    { month: "Apr", engineer: 8.4, company: 7.6 },
    { month: "May", engineer: 8.6, company: 7.5 },
    { month: "Jun", engineer: 8.7, company: 7.5 },
  ]

  const promptHistory = [
    {
      date: "Jan 15, 2024",
      time: "2:34 PM",
      prompt:
        "Refactor authentication logic to use JWT tokens instead of session cookies. Need to maintain backwards compatibility with existing API endpoints.",
      tokens: 1250,
      model: "gpt-4",
    },
    {
      date: "Jan 14, 2024",
      time: "10:22 AM",
      prompt:
        "Create a React component for displaying user analytics dashboard with real-time data updates using WebSocket connection.",
      tokens: 890,
      model: "gpt-4",
    },
    {
      date: "Jan 14, 2024",
      time: "9:15 AM",
      prompt:
        "Debug the API endpoint that's returning 500 errors when processing large file uploads. Check for memory leaks and timeout issues.",
      tokens: 1100,
      model: "claude-3",
    },
    {
      date: "Jan 13, 2024",
      time: "4:50 PM",
      prompt:
        "Optimize database query for user search feature. Currently taking 3+ seconds for queries with multiple filters.",
      tokens: 750,
      model: "gpt-4",
    },
    {
      date: "Jan 12, 2024",
      time: "11:30 AM",
      prompt:
        "Add comprehensive unit tests for the payment processing module including edge cases for refunds and partial payments.",
      tokens: 1400,
      model: "claude-3",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitPullRequest className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{metrics.engineer.prsMerged}</p>
              <p className="text-sm text-muted-foreground">PRs Merged (Monthly)</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg: <span className="text-foreground">{metrics.companyAvg.prsMerged}</span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                {metrics.engineer.estimationAccuracy > 0 ? "+" : ""}
                {metrics.engineer.estimationAccuracy.toFixed(1)}d
              </p>
              <p className="text-sm text-muted-foreground">Estimation Accuracy</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg:{" "}
              <span className="text-foreground">
                {metrics.companyAvg.estimationAccuracy > 0 ? "+" : ""}
                {metrics.companyAvg.estimationAccuracy.toFixed(1)}d
              </span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bug className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{metrics.engineer.bugsGenerated}</p>
              <p className="text-sm text-muted-foreground">Bugs Generated</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg: <span className="text-foreground">{metrics.companyAvg.bugsGenerated}</span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{metrics.engineer.avgReviewTime}</p>
              <p className="text-sm text-muted-foreground">Avg Review Time</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg: <span className="text-foreground">{metrics.companyAvg.avgReviewTime}</span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">${metrics.engineer.aiSpend.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">AI Spend (Monthly)</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg: <span className="text-foreground">${metrics.companyAvg.aiSpend.toFixed(2)}</span>
            </div>
          )}
        </Card>

        {!isProspective && (
          <Card className="p-6 bg-card border-border col-span-1 md:col-span-2 lg:col-span-1">
            <Collapsible open={promptHistoryOpen} onOpenChange={setPromptHistoryOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-2xl font-bold text-foreground">{promptHistory.length}</p>
                    <p className="text-sm text-muted-foreground">Prompt History</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${promptHistoryOpen ? "rotate-180" : ""}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {promptHistory.map((item, idx) => (
                    <div key={idx} className="text-sm p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-medium">
                          {item.date} at {item.time}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {item.model}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed mb-2">{item.prompt}</p>
                      <p className="text-xs text-muted-foreground">{item.tokens.toLocaleString()} tokens</p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>

      {!isProspective && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="engineer" stroke="#3b82f6" strokeWidth={2} name="Performance" />
              <Line
                type="monotone"
                dataKey="company"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Company Average"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
