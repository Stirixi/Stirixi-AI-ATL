"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"

export function OnboardingPanel() {
  const [integrations, setIntegrations] = useState({
    github: false,
    ide: false,
    tickets: false,
  });

  const connectedCount = Object.values(integrations).filter(Boolean).length;
  const totalIntegrations = 3;

  const handleConnect = (integration: keyof typeof integrations) => {
    setIntegrations((prev) => ({ ...prev, [integration]: !prev[integration] }));
  };

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
          <IntegrationRow
            name="GitHub"
            description="Connect your repositories"
            connected={integrations.github}
            onConnect={() => handleConnect('github')}
            logo="/github-mark-white.png"
          />
          <IntegrationRow
            name="Cursor"
            description="Agentic IDE integration"
            connected={integrations.ide}
            onConnect={() => handleConnect('ide')}
            logo="/cursor_logo.png"
          />
          <IntegrationRow
            name="Linear"
            description="Ticket management system"
            connected={integrations.tickets}
            onConnect={() => handleConnect('tickets')}
            logo="/linear_logo.png"
          />
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {connectedCount}/{totalIntegrations} integrations complete
            </span>
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
}: {
  name: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
  logo: string;
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
      >
        {connected ? 'Disconnect' : 'Connect'}
      </Button>
    </div>
  );
}
