"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import type { DeveloperYearStats, YearComparison } from "@/lib/recap/types";
import { ComparisonCard } from "./ComparisonCard";
import { HeaderBar, MetricCard, pct } from "./shared";

export function StatsPage(props: { stats: DeveloperYearStats; tag: string; comparison?: YearComparison | null }) {
  const mergeRate = props.stats.pullRequests === 0 ? 0 : props.stats.mergedPRs / props.stats.pullRequests;
  const isAllTime = props.stats.year === 0;
  const periodLabel = isAllTime ? "累计" : "全年";

  return (
    <Card className="cyber-surface border-white/10">
      <CardHeader>
        <CardTitle className="font-mono text-sm text-zinc-300">SIGNAL / THROUGHPUT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <HeaderBar handle={props.stats.handle} year={props.stats.year} tag={props.tag} />

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          <MetricCard title="Commits" value={props.stats.commits.toLocaleString()} sub={`${periodLabel}提交`} />
          <MetricCard title="Pull Requests" value={props.stats.pullRequests.toLocaleString()} sub="提案与交付" />
          <MetricCard title="Merged PRs" value={props.stats.mergedPRs.toLocaleString()} sub="合并到主线" />
          <MetricCard title="Reviews" value={props.stats.reviews.toLocaleString()} sub="协作与把关" />
          <MetricCard title="Issues" value={props.stats.issues.toLocaleString()} sub="问题追踪" />
          <MetricCard
            title="Stars (repos)"
            value={props.stats.starsGained.toLocaleString()}
            sub="仓库星标合计（采样）"
          />
        </div>

        <Separator className="bg-white/10" />

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm text-zinc-300">
                <span>PR 推进力</span>
                <Badge className="bg-[color:var(--cyber-accent)]/20 text-[color:var(--cyber-accent)]">
                  {pct(mergeRate)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={Math.round(mergeRate * 100)} className="h-2 bg-white/10" />
              <div className="text-sm text-zinc-400">
                合并率越高，说明你把想法更快地变成"可运行的现实"。
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm text-zinc-300">
                <span>活跃节奏</span>
                <Badge variant="secondary" className="border border-white/10 bg-white/5 text-zinc-200">
                  {props.stats.activeDays} days
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress
                value={Math.min(100, Math.round((props.stats.activeDays / 365) * 100))}
                className="h-2 bg-white/10"
              />
              <div className="text-sm text-zinc-400">
                最长连击 {props.stats.maxStreakDays} 天；周末活跃 {pct(props.stats.weekendRate)}。
              </div>
            </CardContent>
          </Card>
        </div>

        {props.comparison && props.comparison.previous && (
          <>
            <Separator className="bg-white/10" />
            <ComparisonCard comparison={props.comparison} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
