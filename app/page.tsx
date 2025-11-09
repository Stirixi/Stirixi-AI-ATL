import type { Metadata } from "next"

import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, BadgeCheck, BarChart3, Bot, Layers } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const capabilities = [
  {
    title: 'Live Engineering Cockpit',
    description:
      'Track PR throughput, bug rates, review latency, AI spend, and hiring funnels from a single Next.js dashboard.',
    icon: BarChart3,
  },
  {
    title: 'StirixiAI Copilot',
    description:
      'A Gemini-powered assistant reads your org snapshot and recommends staffing or mentorship moves in plain language.',
    icon: Bot,
  },
  {
    title: 'On-chain Reputation',
    description:
      'Soulbound Tokens on Solana Devnet capture each engineer’s performance snapshot with tamper-proof proof-of-work.',
    icon: BadgeCheck,
  },
  {
    title: 'Full Data Stack',
    description:
      'MongoDB, Snowflake, and FastAPI services unify GitHub, Linear, Codex, Cursor, and Claude signals into one source of truth.',
    icon: Layers,
  },
];

const stats = [
  { label: 'Connected systems', value: '5+' },
  { label: 'Engineer insights', value: 'Live' },
  { label: 'Employee analytics', value: 'Soulbound' },
  { label: 'AI copilot engine', value: 'Gemini' },
];

export const metadata: Metadata = {
  title: "Integrations Onboarding",
  description: "Connect GitHub, IDE agents, and ticketing data sources to boot Stirixi in under a day.",
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-32 h-64 w-2xl -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-10%] -top-24 h-72 w-72 rounded-full bg-secondary/30 blur-[140px]" />
      </div>
      <AppHeader />
      <main className="relative">
        <section className="container mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-28">
          <div className="flex flex-col items-start gap-12 md:grid md:grid-cols-2 md:items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                  Identify net-positive engineers with AI-driven insights
                </h1>
                <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                  Stirixi unifies GitHub, Linear, AI tooling metrics, Snowflake
                  analytics, and Solana credentials—giving CTOs complete
                  visibility into which engineers accelerate delivery and why.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="shadow-sm">
                  <Link href="/integrations">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              </div>
              <div className="grid w-full grid-cols-2 gap-4 text-sm text-muted-foreground sm:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border/60 bg-background/70 p-4 backdrop-blur-sm"
                  >
                    <p className="text-2xl font-semibold text-foreground">
                      {stat.value}
                    </p>
                    <p>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md md:max-w-lg">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-br from-primary/15 via-secondary/10 to-background blur-3xl" />
              <Card className="p-6 bg-secondary/50 border-border shadow-xl backdrop-blur">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      SK
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">
                      Sarah Kim
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Senior Full-Stack Engineer
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 border border-border mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Performance Score
                    </span>
                    <span className="text-2xl font-bold text-green-500">
                      8.7
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">PRs Merged</span>
                    <span className="text-foreground font-medium">
                      24/month
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Bugs Generated
                    </span>
                    <span className="text-foreground font-medium">3</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-16" id="inspiration">
          <Card className="border-border/60 bg-card/90">
            <CardHeader className="gap-4">
              <div className="flex items-center gap-3 text-primary">
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Inspiration
                </span>
              </div>
              <CardTitle className="text-2xl">
                Closing the blind spot on net-positive engineers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground md:text-base">
              <p>
                CTOs and engineering managers constantly face a blind spot: it’s
                hard to prove who on the team is truly a net positive when
                GitHub commits, PR reviews, and AI tool usage live in silos.
              </p>
              <p>
                We built Stirixi AI ATL to unify that signal—the first
                observability cockpit blending delivery metrics, AI tooling
                activity, and on-chain proof-of-work into a single “CTO
                operating system.”
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-6 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              What it does
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Stirixi AI ATL helps leaders instantly spot net-positive, neutral,
              and net-negative engineers by fusing delivery health, AI leverage,
              and hiring signals.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {capabilities.map((capability) => (
              <Card
                key={capability.title}
                className="border-border/70 bg-card/90 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <CardHeader className="gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <capability.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {capability.title}
                  </CardTitle>
                  <CardDescription>{capability.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-primary/20 via-background to-secondary/20 p-12 text-center shadow-xl">
            <div className="absolute inset-x-12 -top-24 h-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
              <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Bring clarity to every engineering decision
              </h3>
              <p className="text-base text-muted-foreground md:text-lg">
                Explore how Stirixi pairs delivery analytics, AI copilots, and
                evidence-backed credentials to spotlight net-positive impact and
                guide next best actions.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="shadow-sm">
                  <Link href="/integrations">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
