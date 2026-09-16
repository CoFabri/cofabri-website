// src/components/developer-portal/docs/UseWithAiButton.tsx
//
// The header's old "Use with AI" link just opened the raw openapi.json file
// -- not actually useful to a person trying to hand this reference to an
// assistant. This gives them something to paste: a ready-made prompt
// pointing the assistant at the same two real, live endpoints the sidebar's
// AiPanel already links to (llms.txt, openapi.json). No fabricated MCP
// entry or extra resources -- only what this app actually publishes.
'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function buildPrompt(appName: string, specUrl: string, llmsTxtUrl: string): string {
  return `I'm integrating with the ${appName} API. Before writing any code, fetch and read its live reference:

- OpenAPI 3.1 spec: ${specUrl}
- Plain-text endpoint index: ${llmsTxtUrl}

Use the real endpoints, parameters, and schemas from those URLs -- don't guess at the API shape.`;
}

export function UseWithAiButton({ appName, specUrl, llmsTxtUrl }: { appName: string; specUrl: string; llmsTxtUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(buildPrompt(appName, specUrl, llmsTxtUrl));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard permission denied or unavailable -- nothing to fall back
      // to here beyond leaving the button unclicked; the dropdown's direct
      // links still work.
      console.error('copyPrompt failed:', err);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-accent-solid/25 bg-accent px-3.5 py-2 text-[13.5px] font-semibold text-accent-foreground hover:border-accent-solid/50">
          <span className="font-mono text-[12px]">{'{ }'}</span>
          Use with AI
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); copyPrompt(); }} className="flex-col items-start gap-0.5 py-2.5">
          <span className="text-[13.5px] font-semibold">{copied ? 'Copied!' : 'Copy prompt for AI'}</span>
          <span className="text-[12px] text-muted-foreground">Paste into Claude, ChatGPT, or your editor</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="flex-col items-start gap-0.5 py-2.5">
          <a href={llmsTxtUrl} target="_blank" rel="noopener noreferrer">
            <span className="text-[13.5px] font-semibold">llms.txt</span>
            <span className="text-[12px] text-muted-foreground">Flat endpoint index for an agent to crawl</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="flex-col items-start gap-0.5 py-2.5">
          <a href={specUrl} target="_blank" rel="noopener noreferrer">
            <span className="text-[13.5px] font-semibold">openapi.json</span>
            <span className="text-[12px] text-muted-foreground">Full OpenAPI 3.1 spec</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
