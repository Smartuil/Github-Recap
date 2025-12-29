"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import type { DeveloperYearStats } from "@/lib/recap/types";
import { HeatmapCard } from "./HeatmapCard";
import { HeaderBar, StatTile, pct } from "./shared";

export function LanguagePage(props: { stats: DeveloperYearStats; tag: string; codename: string }) {
  return (
    <Card className="cyber-surface border-white/10">
      <CardHeader>
        <CardTitle className="font-mono text-sm text-zinc-300">LANGUAGE SPECTRUM</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <HeaderBar handle={props.stats.handle} year={props.stats.year} tag={props.tag} />

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300">Top Languages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-scrollable>
              {props.stats.topLanguages.map((l) => (
                <div key={l.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm text-zinc-200">{l.name}</div>
                    <div className="text-xs text-zinc-400">{pct(l.percent)}</div>
                  </div>
                  <Progress value={Math.round(l.percent * 100)} className="h-2 bg-white/10" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300">年度高光仓库</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold sm:text-xl">{props.stats.highlightRepo.name}</div>
                  <Badge className="bg-[color:var(--cyber-accent)]/20 text-[color:var(--cyber-accent)]">
                    {props.stats.highlightRepo.starsGained} ★
                  </Badge>
                </div>
                {props.stats.highlightRepo.description ? (
                  <p className="mt-2 text-zinc-300">{props.stats.highlightRepo.description}</p>
                ) : (
                  <p className="mt-2 text-zinc-400">（该仓库未设置描述）</p>
                )}
              </div>

              <Separator className="bg-white/10" />

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <StatTile label="最长连击" value={`${props.stats.maxStreakDays} 天`} hint="稳定的节奏决定长期战斗力。" />
                <StatTile label="风格指纹" value={props.codename} hint="标签来自行为特征，而不是鸡汤。" />
              </div>
            </CardContent>
          </Card>
        </div>

        {props.stats.contributionCalendar && props.stats.contributionCalendar.length > 0 && (
          <>
            <Separator className="bg-white/10" />
            <HeatmapCard calendar={props.stats.contributionCalendar} year={props.stats.year} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
