"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const integrationCatalog = [
  {
    key: "github",
    name: "GitHub",
    description: "Connect your repositories",
    logo: "/github-mark-white.png",
  },
  {
    key: "cursor",
    name: "Cursor",
    description: "Agentic IDE integration",
    logo: "/cursor_logo.png",
  },
  {
    key: "linear",
    name: "Linear",
    description: "Ticket management system",
    logo: "/linear_logo.png",
  },
] as const

type IntegrationKey = (typeof integrationCatalog)[number]["key"]

const createInitialState = () =>
  integrationCatalog.reduce<Record<IntegrationKey, boolean>>((acc, item) => {
    acc[item.key] = false
    return acc
  }, {} as Record<IntegrationKey, boolean>)

export function OnboardingPanel() {
  const [integrations, setIntegrations] = useState<Record<IntegrationKey, boolean>>(() => createInitialState())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('stirixi-integrations')
      if (stored) {
        const parsed = JSON.parse(stored) as Record<IntegrationKey, boolean>
        setIntegrations((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // Ignore localStorage errors and fall back to defaults
    } finally {
      setHydrated(true)
    }
  }, [])

  const connectedCount = useMemo(
    () => Object.values(integrations).filter(Boolean).length,
    [integrations],
  )
  const totalIntegrations = integrationCatalog.length

  const handleConnect = (integration: IntegrationKey) => {
    setIntegrations((prev) => {
      const next = { ...prev, [integration]: !prev[integration] }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('stirixi-integrations', JSON.stringify(next))
      }
      return next
    })
  }

  const statusLabel = hydrated
    ? `${connectedCount}/${totalIntegrations} integrations complete`
    : 'Loading your setup…'

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Connect Your Tools
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete your setup to start analyzing engineering metrics
          </p>
        </div>

        <div className="space-y-3">
          {integrationCatalog.map((integration) => (
            <IntegrationRow
              key={integration.key}
              name={integration.name}
              description={integration.description}
              logo={integration.logo}
              connected={integrations[integration.key]}
              onConnect={() => handleConnect(integration.key)}
              disabled={!hydrated}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{statusLabel}</span>
            <div className="flex gap-1">
              {Array.from({ length: totalIntegrations }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i < connectedCount ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          {connectedCount > 0 && (
            <Button asChild className="w-full">
              <Link href="/dashboard" className="flex items-center justify-center gap-2">
                Continue to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function IntegrationRow({
  name,
  description,
  connected,
  onConnect,
  logo,
  disabled,
}: {
  name: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
  logo: string;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
          <Image
            src={logo}
            alt={`${name} logo`}
            width={24}
            height={24}
            className={`h-full w-full object-contain transition-all ${connected ? 'filter-[invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(86deg)_brightness(118%)_contrast(119%)]' : ''}`}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={connected ? 'outline' : 'default'}
        onClick={onConnect}
        disabled={disabled}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </Button>
    </div>
  );
}
