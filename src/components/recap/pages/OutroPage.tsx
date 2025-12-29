"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DeveloperYearStats } from "@/lib/recap/types";
import { HeaderBar } from "./shared";

export function OutroPage(props: { stats: DeveloperYearStats; tag: string }) {
  return (
    <Card className="cyber-surface border-white/10">
      <CardHeader>
        <CardTitle className="font-mono text-sm text-zinc-300">SHUTDOWN</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <HeaderBar handle={props.stats.handle} year={props.stats.year} tag={props.tag} />

        <div className="space-y-2 sm:space-y-3">
          <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
            这就是你的 {props.stats.year === 0 ? "全部旅程" : props.stats.year}。
          </div>
          <p className="text-sm text-zinc-300 sm:text-base">
            你{props.stats.year === 0 ? "这些年" : "这一年"}不是"写了多少行"，而是把多少不确定性变成了可交付、可维护、可复用。
          </p>
        </div>



        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge className="bg-[color:var(--cyber-accent)]/20 text-[color:var(--cyber-accent)]">END OF LINE</Badge>
          <div className="font-mono text-xs text-zinc-500">↑ revisit / ↓ replay</div>
        </div>
      </CardContent>
    </Card>
  );
}
