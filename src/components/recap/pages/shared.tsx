"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function safeCopy(text: string) {
  if (!navigator?.clipboard?.writeText) return;
  navigator.clipboard.writeText(text);
}

export function HeaderBar(props: {
  handle: string;
  year: number;
  tag?: string;
  right?: React.ReactNode;
}) {
  const yearLabel = props.year === 0 ? "all-time" : String(props.year);
  const yearDisplay = props.year === 0 ? "All Time" : String(props.year);
  
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <div className="min-w-0">
        <div className="truncate font-mono text-xs text-zinc-400">
          {props.handle || "unknown"}@github:~/recap/{yearLabel}$
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <div className="truncate text-base font-semibold tracking-tight text-zinc-100 cyber-flicker sm:text-xl">
            GitHub Recap {yearDisplay}
          </div>

        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {props.tag ? (
          <Badge className="hidden bg-[color:var(--cyber-accent)]/20 text-[color:var(--cyber-accent)] sm:inline-flex">
            {props.tag}
          </Badge>
        ) : null}
        {props.right}
      </div>
    </div>
  );
}

export function MetricCard(props: { title: string; value: string; sub: string }) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="space-y-1 p-3 sm:space-y-2 sm:pt-6 sm:p-6">
        <div className="font-mono text-xs text-zinc-500">{props.title}</div>
        <div className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">{props.value}</div>
        <div className="text-xs text-zinc-400 sm:text-sm">{props.sub}</div>
      </CardContent>
    </Card>
  );
}

export function StatTile(props: { label: string; value: string; hint: string }) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="space-y-1 p-3 sm:space-y-2 sm:pt-6 sm:p-6">
        <div className="text-xs text-zinc-400 sm:text-sm">{props.label}</div>
        <div className="text-lg font-semibold text-zinc-100 sm:text-2xl">{props.value}</div>
        <div className="text-xs text-zinc-400 sm:text-sm">{props.hint}</div>
      </CardContent>
    </Card>
  );
}
